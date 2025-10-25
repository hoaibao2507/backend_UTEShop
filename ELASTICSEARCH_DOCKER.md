# Hướng dẫn chạy Elasticsearch với Docker

## 1. Chạy Elasticsearch với Docker Compose

```bash
# Chạy Elasticsearch và Kibana
docker-compose up -d

# Kiểm tra trạng thái
docker-compose ps

# Xem logs
docker-compose logs elasticsearch
```

## 2. Kiểm tra kết nối

```bash
# Test kết nối Elasticsearch
curl http://localhost:9200

# Kiểm tra Kibana
# Mở trình duyệt: http://localhost:5601
```

## 3. Cấu hình Environment Variables

Thêm vào file `.env`:

```env
# Elasticsearch Configuration
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
```

## 4. Restart ứng dụng

```bash
npm run start:dev
```

## 5. Troubleshooting

### Nếu gặp lỗi memory:
```bash
# Tăng memory limit
sudo sysctl -w vm.max_map_count=262144
```

### Nếu gặp lỗi permission:
```bash
# Fix permission
sudo chown -R 1000:1000 ./elasticsearch_data
```

## 6. Dừng services

```bash
docker-compose down
```