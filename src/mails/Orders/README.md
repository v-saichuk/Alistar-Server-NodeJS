# Email Template System для замовлень

Ця система дозволяє використовувати окремий HTML файл як шаблон для email повідомлень про замовлення.

## Структура файлів

-   `index.html` - HTML шаблон з плейсхолдерами
-   `NewOrder.message.js` - JavaScript функція для відправки email
-   `example-usage.js` - Приклад використання
-   `README.md` - Цей файл з інструкціями

## Плейсхолдери в HTML шаблоні

### Прості плейсхолдери

-   `{{firstName}}` - Ім'я користувача
-   `{{lastName}}` - Прізвище користувача
-   `{{userEmail}}` - Email користувача
-   `{{orderNumber}}` - Номер замовлення
-   `{{orderDate}}` - Дата замовлення
-   `{{orderId}}` - ID замовлення
-   `{{subtotal}}` - Проміжна сума
-   `{{shipping}}` - Вартість доставки
-   `{{grandTotal}}` - Загальна сума
-   `{{paymentMethod}}` - Спосіб оплати

### Адреси

-   `{{billingName}}` - Ім'я для білінгу
-   `{{billingAddress}}` - Білінгова адреса
-   `{{billingPhone}}` - Телефон для білінгу
-   `{{shippingName}}` - Ім'я для доставки
-   `{{shippingAddress}}` - Адреса доставки
-   `{{shippingPhone}}` - Телефон для доставки
-   `{{shippingMethod}}` - Спосіб доставки

### Цикл для товарів

```html
{{#each orderItems}}
<tr style="border-top: 1px solid #e5e5e5">
    <td style="border-right: 1px solid #e5e5e5; line-height: 17px">
        <a href="#" style="text-decoration: underline; color: #027fc2" target="_blank"> {{productName}} </a>
    </td>
    <td style="border-right: 1px solid #e5e5e5">{{quantity}}</td>
    <td style="border-right: 1px solid #e5e5e5">{{unitPrice}}</td>
    <td style="border-right: 1px solid #e5e5e5">{{extPrice}}</td>
</tr>
{{/each}}
```

## Використання

### 1. Підготовка даних

```javascript
const orderData = {
    firstName: 'John',
    lastName: 'Doe',
    userEmail: 'john.doe@example.com',
    orderNumber: 'FS250618217042',
    orderDate: '06/18/2025',
    orderId: '#AL250618167041',
    orderItems: [
        {
            productName: 'Product Name',
            quantity: 2,
            unitPrice: '$799.00',
            extPrice: '$1,598.00',
        },
    ],
    subtotal: '$7,935.00',
    shipping: '$0.00',
    grandTotal: '$7,935.00',
    paymentMethod: 'Bank Transfer',
    billingName: 'Bob Marlei',
    billingAddress: 'Address line 1<br/>Address line 2<br/>City, Country',
    billingPhone: '+380-990939944',
    shippingName: 'Bob Marlei',
    shippingAddress: 'Address line 1<br/>Address line 2<br/>City, Country',
    shippingPhone: '+380-990939944',
    shippingMethod: 'customzones & customzones',
};
```

### 2. Відправка email

```javascript
import { NewUserOrderMessage } from './NewOrder.message.js';

try {
    const result = await NewUserOrderMessage(orderData);
    console.log('Email sent successfully:', result);
} catch (error) {
    console.error('Failed to send email:', error);
}
```

## Переваги цього підходу

1. **Розділення відповідальності** - HTML і JavaScript код розділені
2. **Легке редагування** - HTML можна редагувати без зміни JavaScript коду
3. **Перевикористання** - Шаблон можна використовувати для різних типів email
4. **Читабельність** - Код стає більш зрозумілим і підтримуваним
5. **Гнучкість** - Легко додавати нові плейсхолдери або змінювати структуру

## Додавання нових плейсхолдерів

1. Додайте плейсхолдер в `index.html`: `{{newPlaceholder}}`
2. Передайте відповідне значення в `orderData` об'єкті
3. Функція `replacePlaceholders` автоматично замінить плейсхолдер на значення

## Примітки

-   Всі плейсхолдери повинні бути в форматі `{{placeholderName}}`
-   Для циклів використовуйте `{{#each arrayName}}` і `{{/each}}`
-   HTML теги в адресах повинні бути закодовані як `&lt;br/&gt;` або передаватися як `<br/>`
