-- Check if the specific invoice exists and has proper request_id
SELECT
    id,
    request_id,
    status,
    created_at
FROM invoices
WHERE id = '04de192f-4f01-4d4f-9c75-e051a2bc2c9d';

-- Check if the request_id is valid (has matching request)
SELECT
    i.id as invoice_id,
    i.request_id,
    r.id as request_id_check,
    r.customer_name,
    r.service_address
FROM invoices i
LEFT JOIN requests r ON i.request_id = r.id
WHERE i.id = '04de192f-4f01-4d4f-9c75-e051a2bc2c9d';
