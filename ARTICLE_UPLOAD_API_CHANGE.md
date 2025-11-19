# 文章上傳 API 架構變更說明

## 變更摘要

前端已將文章建立/修改的檔案上傳方式從 **FormData 直接嵌入檔案** 改為 **先上傳取得 pk，再傳遞 pk** 的方式。

### 變更原因
1. **統一上傳流程**：與活動建立/修改的模式一致
2. **簡化 API 格式**：統一使用 JSON 格式，不再根據有無檔案切換格式
3. **提升可維護性**：檔案上傳邏輯獨立，更容易除錯和優化
4. **更好的錯誤處理**：可以在上傳階段就捕獲檔案相關錯誤

---

## API 格式對比

### 舊格式（FormData）
```
POST /api/article/create/
Content-Type: multipart/form-data

FormData {
  title: "文章標題"
  content: "文章內容"
  status: "published"
  tags: ["標籤1", "標籤2"]
  cover_image: File (binary)
  images: [File, File, ...] (binary)
  videos: [File, File, ...] (binary)
  reading_conditions: JSON string
}
```

### 新格式（JSON + pk）
```
POST /api/article/create/
Content-Type: application/json

{
  "title": "文章標題",
  "content": "文章內容",
  "status": "published",
  "tags": ["標籤1", "標籤2"],
  "cover_image_pk": 123,           // Static_Usage_Record 的 pk
  "image_pks": [124, 125, 126],    // Static_Usage_Record 的 pk 列表
  "video_pks": [127, 128],         // Static_Usage_Record 的 pk 列表
  "reading_conditions": [...]       // JSON object
}
```

---

## 前端工作流程

### 建立文章
```typescript
// 1. 先上傳封面圖片
const coverUploadResponse = await uploadFile(coverImageFile);
const cover_image_pk = coverUploadResponse.data.Static_Usage_Record_pk;

// 2. 上傳所有圖片
const imagePks = [];
for (const imageFile of imageFiles) {
  const response = await uploadFile(imageFile);
  imagePks.push(response.data.Static_Usage_Record_pk);
}

// 3. 上傳所有影片
const videoPks = [];
for (const videoFile of videoFiles) {
  const response = await uploadFile(videoFile);
  videoPks.push(response.data.Static_Usage_Record_pk);
}

// 4. 呼叫建立文章 API（只傳 pk）
const response = await createArticle({
  title: "標題",
  content: "內容",
  status: "published",
  tags: ["tag1"],
  cover_image_pk: cover_image_pk,
  image_pks: imagePks,
  video_pks: videoPks
});
```

### 修改文章
```typescript
// 1. 只上傳新增的檔案（舊檔案保留 pk）
const imagePks = [];

for (const imageUrl of images) {
  if (imageUrl.startsWith('data:')) {
    // 新上傳的圖片
    const file = await dataUrlToFile(imageUrl);
    const response = await uploadFile(file);
    imagePks.push(response.data.Static_Usage_Record_pk);
  } else if (imageUrl.startsWith('http')) {
    // 已存在的圖片：從原文章資料取得 pk
    const existingImage = article.images.find(img => img.url === imageUrl);
    if (existingImage.static_usage_record_pk) {
      imagePks.push(existingImage.static_usage_record_pk);
    }
  }
}

// 2. 呼叫更新文章 API
const response = await updateArticle(articleId, {
  title: "新標題",
  content: "新內容",
  image_pks: imagePks  // 包含舊 pk + 新 pk
});
```

---

## 後端需要調整的部分

### 1. 修改 Article Model
確保 `images` 和 `videos` 關聯有 `static_usage_record` 外鍵：

```python
class ArticleImage(models.Model):
    article = models.ForeignKey('Article', on_delete=models.CASCADE, related_name='images')
    static_usage_record = models.ForeignKey(
        'StaticUsageRecord',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    url = models.URLField()
    caption = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)

class ArticleVideo(models.Model):
    article = models.ForeignKey('Article', on_delete=models.CASCADE, related_name='videos')
    static_usage_record = models.ForeignKey(
        'StaticUsageRecord',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    url = models.URLField()
    caption = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)
```

### 2. 修改 ArticleSerializer
```python
class ArticleSerializer(serializers.ModelSerializer):
    # 輸入：接收 pk 列表
    cover_image_pk = serializers.IntegerField(required=False, write_only=True)
    image_pks = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    video_pks = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )

    # 輸出：返回完整的圖片/影片資訊（包含 static_usage_record_pk）
    images = ArticleImageSerializer(many=True, read_only=True)
    videos = ArticleVideoSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'content', 'status', 'tags',
            'cover_image_pk', 'image_pks', 'video_pks',
            'images', 'videos',
            'created_at', 'updated_at', 'published_at'
        ]

class ArticleImageSerializer(serializers.ModelSerializer):
    static_usage_record_pk = serializers.IntegerField(
        source='static_usage_record.pk',
        read_only=True
    )

    class Meta:
        model = ArticleImage
        fields = ['id', 'url', 'caption', 'order', 'static_usage_record_pk']

class ArticleVideoSerializer(serializers.ModelSerializer):
    static_usage_record_pk = serializers.IntegerField(
        source='static_usage_record.pk',
        read_only=True
    )

    class Meta:
        model = ArticleVideo
        fields = ['id', 'url', 'caption', 'order', 'static_usage_record_pk']
```

### 3. 修改 create/update View
```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Article, ArticleImage, ArticleVideo, StaticUsageRecord

@api_view(['POST'])
def create_article(request):
    serializer = ArticleSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    # 建立文章
    article = serializer.save(provider=request.user)

    # 處理封面圖片 pk
    cover_image_pk = request.data.get('cover_image_pk')
    if cover_image_pk:
        try:
            record = StaticUsageRecord.objects.get(pk=cover_image_pk)
            article.cover_image_url = record.url
            article.save()
        except StaticUsageRecord.DoesNotExist:
            pass

    # 處理圖片 pk 列表
    image_pks = request.data.get('image_pks', [])
    for order, pk in enumerate(image_pks):
        try:
            record = StaticUsageRecord.objects.get(pk=pk)
            ArticleImage.objects.create(
                article=article,
                static_usage_record=record,
                url=record.url,
                order=order
            )
        except StaticUsageRecord.DoesNotExist:
            continue

    # 處理影片 pk 列表
    video_pks = request.data.get('video_pks', [])
    for order, pk in enumerate(video_pks):
        try:
            record = StaticUsageRecord.objects.get(pk=pk)
            ArticleVideo.objects.create(
                article=article,
                static_usage_record=record,
                url=record.url,
                order=order
            )
        except StaticUsageRecord.DoesNotExist:
            continue

    return Response({
        'success': True,
        'data': ArticleSerializer(article).data
    })

@api_view(['POST'])
def update_article(request, article_id):
    try:
        article = Article.objects.get(pk=article_id, provider=request.user)
    except Article.DoesNotExist:
        return Response({'success': False, 'message': '文章不存在'}, status=404)

    serializer = ArticleSerializer(article, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    article = serializer.save()

    # 更新封面圖片
    cover_image_pk = request.data.get('cover_image_pk')
    if cover_image_pk:
        try:
            record = StaticUsageRecord.objects.get(pk=cover_image_pk)
            article.cover_image_url = record.url
            article.save()
        except StaticUsageRecord.DoesNotExist:
            pass

    # 更新圖片列表（先清空再重建）
    if 'image_pks' in request.data:
        article.images.all().delete()
        image_pks = request.data.get('image_pks', [])
        for order, pk in enumerate(image_pks):
            try:
                record = StaticUsageRecord.objects.get(pk=pk)
                ArticleImage.objects.create(
                    article=article,
                    static_usage_record=record,
                    url=record.url,
                    order=order
                )
            except StaticUsageRecord.DoesNotExist:
                continue

    # 更新影片列表（先清空再重建）
    if 'video_pks' in request.data:
        article.videos.all().delete()
        video_pks = request.data.get('video_pks', [])
        for order, pk in enumerate(video_pks):
            try:
                record = StaticUsageRecord.objects.get(pk=pk)
                ArticleVideo.objects.create(
                    article=article,
                    static_usage_record=record,
                    url=record.url,
                    order=order
                )
            except StaticUsageRecord.DoesNotExist:
                continue

    return Response({
        'success': True,
        'data': ArticleSerializer(article).data
    })
```

---

## 測試建議

### 1. 測試建立文章
```bash
# 先上傳檔案
curl -X POST http://localhost:8000/api/upload_file/ \
  -H "Authorization: Bearer <token>" \
  -F "file=@cover.jpg"
# 回應: {"success": true, "data": {"Static_Usage_Record_pk": 123, "url": "..."}}

# 再建立文章
curl -X POST http://localhost:8000/api/article/create/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "測試文章",
    "content": "測試內容",
    "status": "published",
    "tags": ["測試"],
    "cover_image_pk": 123,
    "image_pks": [124, 125],
    "video_pks": [126]
  }'
```

### 2. 測試更新文章
```bash
curl -X POST http://localhost:8000/api/article/update/1/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新後標題",
    "image_pks": [124, 127]  // 保留 124，新增 127，移除 125
  }'
```

### 3. 驗證回傳資料
確保 GET `/api/article/detail/<id>/` 回傳的資料包含：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "文章標題",
    "images": [
      {
        "id": 10,
        "url": "https://...",
        "static_usage_record_pk": 124,  // ← 必須包含此欄位
        "order": 0
      }
    ],
    "videos": [
      {
        "id": 20,
        "url": "https://...",
        "static_usage_record_pk": 126,  // ← 必須包含此欄位
        "order": 0
      }
    ]
  }
}
```

---

## FAQ

### Q1: 為什麼要返回 `static_usage_record_pk`？
**A**: 前端編輯文章時需要知道哪些檔案是已存在的（透過 pk 識別），哪些是新上傳的。沒有這個欄位，前端無法正確處理「保留舊圖片 + 新增新圖片」的情境。

### Q2: 如果前端傳了不存在的 pk 怎麼辦？
**A**: 後端應該忽略不存在的 pk（使用 `try-except StaticUsageRecord.DoesNotExist`），避免整個請求失敗。可以在 log 中記錄警告。

### Q3: 需要驗證 pk 所屬的用戶嗎？
**A**: 建議驗證。確保 `StaticUsageRecord.user == request.user`，防止用戶使用別人上傳的檔案。

```python
record = StaticUsageRecord.objects.get(pk=pk, user=request.user)
```

### Q4: 舊的 FormData API 需要保留嗎？
**A**: 建議保留一段過渡期（例如 1-2 週），然後移除。前端已完全切換到新格式。

### Q5: 如果用戶刪除了某個 StaticUsageRecord 怎麼辦？
**A**: 應該實作級聯刪除或軟刪除：
- **級聯刪除**: `on_delete=models.CASCADE`（文章的圖片也會被刪除）
- **軟刪除**: 保留記錄但標記為已刪除，顯示時使用預設佔位圖

---

## 變更檢查清單

後端實作時請確認：

- [ ] Article Model 已新增或更新 `images` 和 `videos` 的 `static_usage_record` 外鍵
- [ ] ArticleSerializer 支援 `cover_image_pk`, `image_pks`, `video_pks` 作為輸入
- [ ] ArticleImageSerializer 和 ArticleVideoSerializer 回傳 `static_usage_record_pk`
- [ ] create_article View 處理 pk 列表並建立關聯
- [ ] update_article View 處理 pk 列表並正確更新（清空舊的、建立新的）
- [ ] 已測試建立文章流程（上傳檔案 → 建立文章）
- [ ] 已測試更新文章流程（保留舊檔案 + 新增新檔案）
- [ ] GET API 回傳的資料包含 `static_usage_record_pk`
- [ ] 驗證 pk 所屬用戶，防止安全問題
- [ ] 已移除或標記廢棄舊的 FormData API

---

## 聯繫方式

如有疑問，請聯繫前端團隊或查看：
- 前端實作: `src/pages/Article.tsx` (Lines 703-863)
- API 配置: `src/config/api.ts` (Lines 622-810)
- 相關文件: `CLAUDE.md`
