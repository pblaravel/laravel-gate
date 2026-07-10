# gate

Laravel-сервис: выпуск депозитных адресов, индексация входящих депозитов (ETH + ERC-20) и вывод средств с broadcast через RPC. 

## Настройка

В `.env`:

```env
DB_CONNECTION=mysql
DB_DATABASE=gates
WALLET_SERVICE_URL=http://localhost:8001
WALLET_SERVICE_GATE=ethereum
```

Требуется запущенный `wallet-service` (см. `../wallet-service/README.md`).

## Запуск

```bash
composer install
php artisan migrate --seed   # создаёт таблицы и сиды гейтов (eth_sepolia, usdc_sepolia)
php artisan serve            # http://127.0.0.1:8000
```

## Индексация депозитов

```bash
php artisan blockchain:index --base_gate=eth_sepolia [--start_block=N]
```

- сканирует блоки от `start_block` до latest;
- NATIVE — по `tx.to`, ERC-20 — по Transfer-логам `token_contract`;
- уникальность депозита по `(asset_gate_id, tx_hash, log_index)`;
- реорг: хранит `block_hash`/`parent_hash`, при расхождении откатывает также есль депозит в статус CREATED то переходит в статус REORGED;
- депозит становится `CONFIRMED` после `confirmations_required` подтверждений.

## API

| Метод | Эндпоинт | Тело |
|---|---|---|
| POST | `/api/v1/new-address` | `{"gate":"eth_sepolia"}` |
| POST | `/api/v1/withdrawal` | `{"asset_gate":"eth_sepolia","from_address":"0x..","to_address":"0x..","amount":"0.01"}` |

`amount` — строка; конвертация в base units через `bcmath`. 
Вывод проверяет баланс: для NATIVE — `amount + gas`, для ERC-20 — газ (нативный) и `balanceOf` токена.

Пример:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/new-address \
  -H "Content-Type: application/json" \
  -d '{"gate":"eth_sepolia"}'
```
