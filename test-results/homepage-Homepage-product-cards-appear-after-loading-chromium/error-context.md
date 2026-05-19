# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: homepage.spec.js >> Homepage >> product cards appear after loading
- Location: tests\system\homepage.spec.js:20:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h3.cursor-pointer').first()
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('h3.cursor-pointer').first()

```

```yaml
- banner:
  - link "اسرنا اسرنا":
    - /url: /
    - img "اسرنا"
    - text: اسرنا
  - textbox "ابحث عن أكلة، حلوى، أو أسرة..."
  - button "Switch language": EN
  - link "السلة":
    - /url: /cart
  - link "الحساب":
    - /url: /login
  - 'button "التوصيل إلى: الرياض"'
  - paragraph: لا توجد منتجات في الرياض حالياً
- text: منصة الأسر المنتجة السعودية
- heading "ادعم المشاريع العائلية المحلية" [level=1]
- paragraph: اكتشف منتجات أصيلة مصنوعة بحب وإتقان من أسر سعودية منتجة. طعم البيت، جودة لا تُضاهى، وقصة خلف كل منتج.
- button "تسوّق الآن"
- link "انضم كأسرة منتجة":
  - /url: /login
- text: +500 أسرة منتجة +8,000 منتج متاح +15,000 عميل سعيد
- img
- text: توصيل سريع الأطباق الطازجة خلال 1-2 ساعة ضمان الجودة منتجات طازجة ومضمونة أسر موثوقة +500 أسرة منتجة معتمدة شحن وطني لجميع مدن المملكة خلال 48 ساعة
- heading "تصفح الفئات" [level=2]
- button "الكل"
- button "🍛 أطباق رئيسية"
- button "🍰 حلويات"
- button "🧶 مشغولات يدوية"
- button "❄️ مجمدات"
- button "🌿 بهارات"
- heading "منتجات مميزة" [level=2]
- paragraph: عرض 0 منتج بناءً على موقعك في الرياض
- heading "المنتجات في الرياض" [level=3]
- paragraph: متوفرة في مدينتك
- text: 🍽️
- heading "لا توجد منتجات في الرياض حالياً" [level=4]
- paragraph:
  - text: نعمل على توسعة شبكة اسرنا في مدينتك. جرّب اختيار
  - button "جدة"
  - text: أو
  - button "الرياض"
  - text: لرؤية المنتجات المتاحة.
- heading "منتجات تصلك أينما كنت" [level=3]
- paragraph: شحن لجميع مدن المملكة · 24-48 ساعة
- text: 📦
- heading "لا توجد منتجات متوفرة حالياً" [level=4]
- paragraph: سيتم إضافة منتجات جديدة قريباً من الأسر المنتجة.
- heading "هل أنتِ أسرة منتجة؟" [level=2]
- paragraph: انضم إلى أكثر من 500 أسرة تبيع منتجاتها عبر اسرنا وابدأ رحلة نجاحك اليوم. التسجيل مجاني ولا يستغرق سوى دقيقتين.
- link "سجّل أسرتك مجاناً ←":
  - /url: /login
- contentinfo:
  - img "اسرنا"
  - text: اسرنا
  - paragraph: منصة تجمع الأسر المنتجة السعودية مع المستهلكين الباحثين عن أصالة وجودة.
  - button
  - button
  - button
  - heading "روابط سريعة" [level=4]
  - list:
    - listitem:
      - link "الرئيسية":
        - /url: /
    - listitem:
      - button "عن اسرنا"
  - heading "للأسر المنتجة" [level=4]
  - list:
    - listitem:
      - link "سجّل أسرتك":
        - /url: /register-family
    - listitem:
      - link "لوحة التحكم":
        - /url: /dashboard
  - heading "تواصل معنا" [level=4]
  - list:
    - listitem: +966 50 000 0000
    - listitem: hello@usaruna.sa
    - listitem: جدة, المملكة العربية السعودية
  - text: © 2026 اسرنا. جميع الحقوق محفوظة.
  - link "سياسة الخصوصية":
    - /url: "#"
  - link "شروط الاستخدام":
    - /url: "#"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Homepage', () => {
  4  |   test('loads and shows the brand name', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await expect(page).toHaveTitle(/اسرنا/);
  7  |   });
  8  | 
  9  |   test('navigation bar is visible', async ({ page }) => {
  10 |     await page.goto('/');
  11 |     // Logo image should render
  12 |     await expect(page.locator('img[src="/logo.webp"]').first()).toBeVisible();
  13 |   });
  14 | 
  15 |   test('search bar is present', async ({ page }) => {
  16 |     await page.goto('/');
  17 |     await expect(page.locator('input[type="text"], input[type="search"]').first()).toBeVisible();
  18 |   });
  19 | 
  20 |   test('product cards appear after loading', async ({ page }) => {
  21 |     await page.goto('/');
  22 |     // Product names render as <h3 class="...cursor-pointer..."> inside each card
> 23 |     await expect(page.locator('h3.cursor-pointer').first()).toBeVisible({ timeout: 20_000 });
     |                                                             ^ Error: expect(locator).toBeVisible() failed
  24 |   });
  25 | 
  26 |   test('clicking a product card navigates to product details', async ({ page }) => {
  27 |     await page.goto('/');
  28 |     const firstCard = page.locator('h3.cursor-pointer').first();
  29 |     await firstCard.waitFor({ timeout: 20_000 });
  30 |     await firstCard.click();
  31 |     await expect(page).toHaveURL(/\/product\//);
  32 |   });
  33 | });
  34 | 
```