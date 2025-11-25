# Supabase Storage

Supabase Storage provides S3-compatible object storage with built-in access controls, image transformations, and CDN integration.

## Bucket Types

### 1. Standard Buckets
For general file storage: images, documents, videos, etc.

### 2. Vector Buckets
Specialized buckets for storing and querying vector embeddings (AI/ML use cases).

### 3. Analytics Buckets
For storing and analyzing time-series data and metrics.

## Installation

Storage is included in the main Supabase client:

```bash
npm install @supabase/supabase-js
```

Or standalone:

```bash
npm install @supabase/storage-js
```

## Bucket Management

### Create Bucket

```typescript
const { data, error } = await supabase.storage.createBucket('avatars', {
  public: false,
  fileSizeLimit: 1024000, // 1MB
  allowedMimeTypes: ['image/png', 'image/jpeg']
})
```

### List Buckets

```typescript
const { data, error } = await supabase.storage.listBuckets()
```

### Get Bucket

```typescript
const { data, error } = await supabase.storage.getBucket('avatars')
```

### Update Bucket

```typescript
const { data, error } = await supabase.storage.updateBucket('avatars', {
  public: true
})
```

### Delete Bucket

```typescript
const { data, error } = await supabase.storage.deleteBucket('avatars')
```

### Empty Bucket

```typescript
const { data, error } = await supabase.storage.emptyBucket('avatars')
```

## File Operations

### Upload File

```typescript
// Upload from File object
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file, {
    cacheControl: '3600',
    upsert: false
  })

// Upload from ArrayBuffer
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', arrayBuffer, {
    contentType: 'image/png'
  })

// Upload with path
const avatarFile = event.target.files[0]
const filePath = `${userId}/${Date.now()}.png`

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(filePath, avatarFile)
```

### Upload with Progress

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file, {
    onUploadProgress: (progress) => {
      console.log(`Uploaded ${progress.loaded} of ${progress.total} bytes`)
    }
  })
```

### Download File

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .download('public/avatar1.png')

// Convert blob to URL
const url = URL.createObjectURL(data)
```

### List Files

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .list('public', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
    search: 'profile'
  })
```

### Get Public URL

```typescript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar1.png')

console.log(data.publicUrl)
// https://your-project.supabase.co/storage/v1/object/public/avatars/public/avatar1.png
```

### Create Signed URL (Temporary Access)

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .createSignedUrl('private/avatar1.png', 60) // Valid for 60 seconds

console.log(data.signedUrl)
```

### Create Multiple Signed URLs

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .createSignedUrls(['file1.png', 'file2.png'], 60)
```

### Move File

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .move('public/avatar1.png', 'private/avatar1.png')
```

### Copy File

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .copy('public/avatar1.png', 'backup/avatar1.png')
```

### Delete Files

```typescript
// Delete single file
const { data, error } = await supabase.storage
  .from('avatars')
  .remove(['public/avatar1.png'])

// Delete multiple files
const { data, error } = await supabase.storage
  .from('avatars')
  .remove(['file1.png', 'file2.png', 'file3.png'])
```

### Update File Metadata

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .update('public/avatar1.png', file, {
    cacheControl: '3600',
    upsert: true
  })
```

## Image Transformations

Supabase Storage supports on-the-fly image transformations via URL parameters:

```typescript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('avatar1.png', {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover',
      format: 'webp',
      quality: 80
    }
  })
```

### Transformation Options

```typescript
{
  width: 200,           // Width in pixels
  height: 200,          // Height in pixels
  resize: 'cover',      // cover, contain, fill
  format: 'webp',       // webp, jpeg, png, avif
  quality: 80           // 1-100
}
```

### Direct URL Transformations

```
https://project.supabase.co/storage/v1/render/image/public/bucket/image.jpg?width=200&height=200
```

## Access Control with RLS

### Enable RLS

```sql
alter table storage.objects enable row level security;
```

### Public Bucket Policy

```sql
-- Allow public read access
create policy "Public Access"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Allow authenticated users to upload
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );
```

### User-Specific Policy

```sql
-- Users can only access their own files
create policy "Users can access own files"
  on storage.objects for all
  using (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Folder-Based Policy

```sql
-- Allow users to access files in their folder
create policy "User folder access"
  on storage.objects for all
  using (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Vector Buckets (Embeddings)

For AI/ML applications with vector embeddings:

### Create Vector Bucket

```typescript
const { data, error } = await supabase.storage.vectors.createBucket('embeddings-prod')
```

### Create Vector Index

```typescript
const bucket = supabase.storage.vectors.from('embeddings-prod')

await bucket.createIndex({
  indexName: 'documents',
  dimension: 1536, // For OpenAI embeddings
  distanceMetric: 'cosine' // cosine, euclidean, or dot_product
})
```

### Insert Vectors

```typescript
await bucket.insert([
  {
    id: 'doc1',
    vector: [0.1, 0.2, 0.3, ...], // 1536 dimensions
    metadata: { title: 'Document 1' }
  }
])
```

### Query Similar Vectors

```typescript
const results = await bucket.query({
  vector: queryEmbedding,
  limit: 10
})
```

## Analytics Buckets

Track and analyze bucket usage:

### Create Analytics Bucket

```typescript
const { data, error } = await supabase.storage.analytics.createBucket('analytics-prod')
```

### List Analytics Buckets

```typescript
const { data, error } = await supabase.storage.analytics.listBuckets()
```

## Advanced Patterns

### Resumable Uploads

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key, {
  storage: {
    resumable: true
  }
})

const { data, error } = await supabase.storage
  .from('large-files')
  .upload('video.mp4', largeFile, {
    onUploadProgress: (progress) => {
      console.log(`${(progress.loaded / progress.total * 100).toFixed(2)}%`)
    }
  })
```

### Parallel Uploads

```typescript
const uploads = files.map(file =>
  supabase.storage
    .from('documents')
    .upload(`${userId}/${file.name}`, file)
)

const results = await Promise.all(uploads)
```

### Upload with Validation

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large')
}

if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('Invalid file type')
}

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(path, file)
```

### Generate Unique Filenames

```typescript
import { v4 as uuidv4 } from 'uuid'

const fileExt = file.name.split('.').pop()
const fileName = `${uuidv4()}.${fileExt}`
const filePath = `${userId}/${fileName}`

const { data, error } = await supabase.storage
  .from('uploads')
  .upload(filePath, file)
```

## Error Handling

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('path/to/file.png', file)

if (error) {
  switch (error.message) {
    case 'The resource already exists':
      // Handle duplicate
      break
    case 'new row violates row-level security policy':
      // Handle permission error
      break
    default:
      console.error('Upload error:', error.message)
  }
}
```

## Best Practices

1. **Use RLS policies**: Always secure buckets with Row Level Security
2. **Organize files**: Use folder structures like `userId/category/filename`
3. **Validate uploads**: Check file size and type before uploading
4. **Use signed URLs**: For private files, generate time-limited signed URLs
5. **Optimize images**: Use transformation API to serve optimized images
6. **Clean up**: Remove old files to manage storage costs
7. **Use unique names**: Generate unique filenames to avoid conflicts

## Configuration

### Storage Limits (config.toml)

```toml
[storage]
file_size_limit = "50MiB"
```

### CORS Configuration

Storage respects your CORS settings from the Supabase dashboard.

## CLI Commands

```bash
# Seed storage buckets programmatically
# See: supabase/cli examples/seed-storage
```

## References

- Storage Docs: https://supabase.com/docs/guides/storage
- GitHub: https://github.com/supabase/supabase-js/tree/master/packages/core/storage-js
- Image Transformations: https://supabase.com/docs/guides/storage/image-transformations
