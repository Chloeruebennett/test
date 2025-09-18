#!/bin/bash

set -e

IMAGE_NAME="dashy_custom"
IMAGE_TAR_FILE="dashy_image.tar"
DOCKERFILE_PATH="./Dockerfile"
COMPOSE_FILE="./docker-compose.yml"
REPO_URL="https://github.com/Lissy93/dashy.git"
CONFIG_FILE="./dashboard-config.json"
CONTAINER_CONFIG_PATH="/app/config/dashboard-config.json"

echo "Проверка запущенности Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "Ошибка: Docker не запущен или недоступен."
    exit 1
fi
echo "Docker запущен."

echo "Проверка доступа в интернет..."
if ! ping -c 2 google.com > /dev/null 2>&1; then
    echo "Ошибка: Нет доступа к интернету."
    exit 1
fi

echo "Проверка доступности репозитория..."
if ! git ls-remote "$REPO_URL" > /dev/null 2>&1; then
    echo "Ошибка: Не удается получить доступ к репозиторию $REPO_URL."
    exit 1
fi
echo "Доступ к репозиторию есть."

# Создаём или редактируем конфигурационный файл дашборда
echo "Создание файла конфигурации дашборда..."
cat > "$CONFIG_FILE" <<EOF
{
  "dashboard": {
    "title": "Мой кастомный дашборд",
    "widgets": [
      { "type": "graph", "title": "CPU Usage" },
      { "type": "table", "title": "Recent Logs" }
    ]
  }
}
EOF

# Создание Dockerfile с монтированием конфигурационного файла
echo "Создание Dockerfile..."
cat > "$DOCKERFILE_PATH" <<EOF
FROM node:alpine
WORKDIR /app
COPY . /app
RUN apk add --no-cache git
RUN git clone --depth 1 "$REPO_URL" /app
RUN npm install
RUN npm run build
EXPOSE 8080
# Запуск приложения с указанием конфигурационного файла
CMD ["npm", "start", "--", "--config", "$CONTAINER_CONFIG_PATH"]
EOF

# Построение образа
echo "Сборка Docker-образ..."
docker build -t "$IMAGE_NAME" -f "$DOCKERFILE_PATH" .

# Экспорт образа
echo "Экспорт образа..."
docker save -o "$IMAGE_TAR_FILE" "$IMAGE_NAME"

# Очистка Docker
echo "Очищение Docker..."
docker container prune -f
docker image prune -f --all
docker system prune -f --all

# Импорт образа
echo "Импорт образа..."
docker load -i "$IMAGE_TAR_FILE"

# Создание docker-compose с монтированием конфигурации
echo "Создание docker-compose.yml..."
cat > "$COMPOSE_FILE" <<EOF
version: '3'
services:
  dashy:
    image: "$IMAGE_NAME"
    ports:
      - "127.0.0.1:8080:8080"
    volumes:
      - "$(pwd)/dashboard-config.json:$CONTAINER_CONFIG_PATH:ro"
    stdin_open: true
    tty: true
EOF

# Запуск контейнера
echo "Запуск приложения..."
docker-compose -f "$COMPOSE_FILE" up -d

# Проверка
echo "Проверка доступности приложения..."
sleep 5
if curl -s --fail http://localhost:8080 > /dev/null; then
    echo "Приложение успешно запущено и использует локальную конфигурацию."
else
    echo "Ошибка: приложение недоступно."
    docker-compose -f "$COMPOSE_FILE" down
    exit 1
fi

echo "Все операции завершены успешно."
