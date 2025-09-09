// Это workflow для генерации и обработки тестовых данных, связанных с транзакциями или клиентами. Весь поток делится на несколько основных этапов:
// Генерация данных (Code node) — создание массива с 8-ю записями, каждая из которых содержит поля: email, сумма, валюта, статус, дополнительные большие поля (для тестов), дата и рандомное значение.
// Задержка (Wait) — пауза 20 секунд.
// Обработка данных — сортировка, фильтрация, нормализация значений и подготовка к дальнейшей обработке.
// Проверка данных — фильтрация по email, валюта, сумма и прочие условия.
// Форматирование — приведение значений к нужным форматам.
// Запись в файлы (spreadsheetFile) — подготовка файлов для дальнейших экспортах или хранения.
// HTTP-запросы — вызовы API с параметрами, основанными на данных.


{
  "nodes": [
    {
      "parameters": {
        "jsCode": "const statuses = [...];\nconst currencies = [...];\nconst records = [];\nfor (let i = 0; i < 8; i++) {\n  // генерация данных\n}\nreturn records;"
      },
      "name": "Generate Data",
      "type": "n8n-nodes-base.code"
    },
    {
      "parameters": { "amount": 20, "unit": "seconds" },
      "name": "Pause",
      "type": "n8n-nodes-base.wait"
    },
    {
      "parameters": {
        "jsCode": "const itemsCopy = [...items];\n// Перемешивание\nitemsCopy.sort(() => Math.random() - 0.5);\n// Сортировка по email\nitemsCopy.sort((a, b) => (a.json.customer_email || '').localeCompare(b.json.customer_email || ''));\n// Фильтр валидных email\nreturn itemsCopy.filter(item => /^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(item.json.customer_email || ''));"
      },
      "name": "Filter Valid Emails",
      "type": "n8n-nodes-base.code"
    },
    {
      "parameters": {
        "values": {
          "string": [
            { "name": "customer_email", "value": "={{$json.customer_email ? $json.customer_email.toLowerCase().trim() : ''}}" },
            { "name": "currency", "value": "={{($json.currency || '').toUpperCase().trim()}}" },
            { "name": "status", "value": "={{($json.status || '').trim()}}" }
          ],
          "number": [
            { "name": "amount", "value": "={{Number($json.amount) || 0}}" }
          ]
        }
      },
      "name": "Normalize Data",
      "type": "n8n-nodes-base.set"
    },
    {
      "parameters": {
        "values": {
          "string": [
            { "name": "currency_final", "value": "={{$json.currency === 'RUR' ? 'RUB' : $json.currency}}" }
          ]
        }
      },
      "name": "Set Final Currency",
      "type": "n8n-nodes-base.set"
    },
    {
      "parameters": {
        "operation": "toFile"
      },
      "name": "Export to File",
      "type": "n8n-nodes-base.spreadsheetFile"
    },
    {
      "parameters": {
        "url": "https://httpbin.org/get?email={{$json.customer_email}}&random={{$json.random_seed}}"
      },
      "name": "API Call",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}
