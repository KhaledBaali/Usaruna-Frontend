# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: homepage.spec.js >> Homepage >> clicking a product card navigates to product details
- Location: tests\system\homepage.spec.js:26:3

# Error details

```
TimeoutError: locator.waitFor: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('h3.cursor-pointer').first() to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "اسرنا اسرنا" [ref=e6] [cursor=pointer]:
        - /url: /
        - img "اسرنا" [ref=e7]
        - generic [ref=e8]: اسرنا
      - generic [ref=e10]:
        - img
        - textbox "ابحث عن أكلة، حلوى، أو أسرة..." [ref=e11]
      - generic [ref=e12]:
        - button "Switch language" [ref=e13] [cursor=pointer]: EN
        - link "السلة" [ref=e14] [cursor=pointer]:
          - /url: /cart
          - img [ref=e15]
        - link "الحساب" [ref=e19] [cursor=pointer]:
          - /url: /login
          - img [ref=e20]
    - generic [ref=e24]:
      - 'button "التوصيل إلى: الرياض" [ref=e26] [cursor=pointer]':
        - img [ref=e27]
        - generic [ref=e30]: "التوصيل إلى:"
        - generic [ref=e31]: الرياض
        - img [ref=e32]
      - paragraph [ref=e34]: لا توجد منتجات في الرياض حالياً
  - generic [ref=e36]:
    - generic [ref=e37]:
      - generic [ref=e38]: منصة الأسر المنتجة السعودية
      - heading "ادعم المشاريع العائلية المحلية" [level=1] [ref=e40]:
        - text: ادعم المشاريع
        - text: العائلية المحلية
      - paragraph [ref=e41]: اكتشف منتجات أصيلة مصنوعة بحب وإتقان من أسر سعودية منتجة. طعم البيت، جودة لا تُضاهى، وقصة خلف كل منتج.
      - generic [ref=e42]:
        - button "تسوّق الآن" [ref=e43] [cursor=pointer]:
          - text: تسوّق الآن
          - img [ref=e44]
        - link "انضم كأسرة منتجة" [ref=e46] [cursor=pointer]:
          - /url: /login
      - generic [ref=e47]:
        - generic [ref=e48]:
          - generic [ref=e49]: "+500"
          - generic [ref=e50]: أسرة منتجة
        - generic [ref=e51]:
          - generic [ref=e52]: +8,000
          - generic [ref=e53]: منتج متاح
        - generic [ref=e54]:
          - generic [ref=e55]: +15,000
          - generic [ref=e56]: عميل سعيد
    - img [ref=e58]
  - generic [ref=e61]:
    - generic [ref=e62]:
      - img [ref=e64]
      - generic [ref=e69]:
        - generic [ref=e70]: توصيل سريع
        - generic [ref=e71]: الأطباق الطازجة خلال 1-2 ساعة
    - generic [ref=e72]:
      - img [ref=e74]
      - generic [ref=e76]:
        - generic [ref=e77]: ضمان الجودة
        - generic [ref=e78]: منتجات طازجة ومضمونة
    - generic [ref=e79]:
      - img [ref=e81]
      - generic [ref=e84]:
        - generic [ref=e85]: أسر موثوقة
        - generic [ref=e86]: +500 أسرة منتجة معتمدة
    - generic [ref=e87]:
      - img [ref=e89]
      - generic [ref=e93]:
        - generic [ref=e94]: شحن وطني
        - generic [ref=e95]: لجميع مدن المملكة خلال 48 ساعة
  - generic [ref=e97]:
    - heading "تصفح الفئات" [level=2] [ref=e99]
    - generic [ref=e100]:
      - button "الكل" [ref=e101] [cursor=pointer]:
        - generic [ref=e102]: الكل
      - button "🍛 أطباق رئيسية" [ref=e103] [cursor=pointer]:
        - generic [ref=e104]: 🍛
        - generic [ref=e105]: أطباق رئيسية
      - button "🍰 حلويات" [ref=e106] [cursor=pointer]:
        - generic [ref=e107]: 🍰
        - generic [ref=e108]: حلويات
      - button "🧶 مشغولات يدوية" [ref=e109] [cursor=pointer]:
        - generic [ref=e110]: 🧶
        - generic [ref=e111]: مشغولات يدوية
      - button "❄️ مجمدات" [ref=e112] [cursor=pointer]:
        - generic [ref=e113]: ❄️
        - generic [ref=e114]: مجمدات
      - button "🌿 بهارات" [ref=e115] [cursor=pointer]:
        - generic [ref=e116]: 🌿
        - generic [ref=e117]: بهارات
  - generic [ref=e119]:
    - generic [ref=e120]:
      - heading "منتجات مميزة" [level=2] [ref=e121]
      - paragraph [ref=e122]: عرض 0 منتج بناءً على موقعك في الرياض
    - generic [ref=e123]:
      - generic [ref=e125]:
        - img [ref=e127]
        - generic [ref=e130]:
          - heading "المنتجات في الرياض" [level=3] [ref=e131]
          - paragraph [ref=e132]: متوفرة في مدينتك
      - generic [ref=e134]:
        - generic [ref=e135]: 🍽️
        - heading "لا توجد منتجات في الرياض حالياً" [level=4] [ref=e136]
        - paragraph [ref=e137]:
          - text: نعمل على توسعة شبكة اسرنا في مدينتك. جرّب اختيار
          - button "جدة" [ref=e138] [cursor=pointer]
          - text: أو
          - button "الرياض" [ref=e139] [cursor=pointer]
          - text: لرؤية المنتجات المتاحة.
    - generic [ref=e140]:
      - generic [ref=e142]:
        - img [ref=e144]
        - generic [ref=e148]:
          - heading "منتجات تصلك أينما كنت" [level=3] [ref=e149]
          - paragraph [ref=e150]: شحن لجميع مدن المملكة · 24-48 ساعة
      - generic [ref=e152]:
        - generic [ref=e153]: 📦
        - heading "لا توجد منتجات متوفرة حالياً" [level=4] [ref=e154]
        - paragraph [ref=e155]: سيتم إضافة منتجات جديدة قريباً من الأسر المنتجة.
  - generic [ref=e158]:
    - heading "هل أنتِ أسرة منتجة؟" [level=2] [ref=e159]
    - paragraph [ref=e160]: انضم إلى أكثر من 500 أسرة تبيع منتجاتها عبر اسرنا وابدأ رحلة نجاحك اليوم. التسجيل مجاني ولا يستغرق سوى دقيقتين.
    - link "سجّل أسرتك مجاناً ←" [ref=e161] [cursor=pointer]:
      - /url: /login
  - contentinfo [ref=e162]:
    - generic [ref=e163]:
      - generic [ref=e164]:
        - generic [ref=e165]:
          - generic [ref=e166]:
            - img "اسرنا" [ref=e167]
            - generic [ref=e168]: اسرنا
          - paragraph [ref=e169]: منصة تجمع الأسر المنتجة السعودية مع المستهلكين الباحثين عن أصالة وجودة.
          - generic [ref=e170]:
            - button [ref=e171] [cursor=pointer]:
              - img [ref=e172]
            - button [ref=e175] [cursor=pointer]:
              - img [ref=e176]
            - button [ref=e182] [cursor=pointer]:
              - img [ref=e183]
        - generic [ref=e186]:
          - heading "روابط سريعة" [level=4] [ref=e187]
          - list [ref=e188]:
            - listitem [ref=e189]:
              - link "الرئيسية" [ref=e190] [cursor=pointer]:
                - /url: /
            - listitem [ref=e191]:
              - button "عن اسرنا" [ref=e192] [cursor=pointer]
        - generic [ref=e193]:
          - heading "للأسر المنتجة" [level=4] [ref=e194]
          - list [ref=e195]:
            - listitem [ref=e196]:
              - link "سجّل أسرتك" [ref=e197] [cursor=pointer]:
                - /url: /register-family
            - listitem [ref=e198]:
              - link "لوحة التحكم" [ref=e199] [cursor=pointer]:
                - /url: /dashboard
        - generic [ref=e200]:
          - heading "تواصل معنا" [level=4] [ref=e201]
          - list [ref=e202]:
            - listitem [ref=e203]:
              - img [ref=e204]
              - generic [ref=e206]: +966 50 000 0000
            - listitem [ref=e207]:
              - img [ref=e208]
              - generic [ref=e211]: hello@usaruna.sa
            - listitem [ref=e212]:
              - img [ref=e213]
              - generic [ref=e216]: جدة, المملكة العربية السعودية
      - generic [ref=e217]:
        - generic [ref=e218]: © 2026 اسرنا. جميع الحقوق محفوظة.
        - generic [ref=e219]:
          - link "سياسة الخصوصية" [ref=e220] [cursor=pointer]:
            - /url: "#"
          - link "شروط الاستخدام" [ref=e221] [cursor=pointer]:
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
  23 |     await expect(page.locator('h3.cursor-pointer').first()).toBeVisible({ timeout: 20_000 });
  24 |   });
  25 | 
  26 |   test('clicking a product card navigates to product details', async ({ page }) => {
  27 |     await page.goto('/');
  28 |     const firstCard = page.locator('h3.cursor-pointer').first();
> 29 |     await firstCard.waitFor({ timeout: 20_000 });
     |                     ^ TimeoutError: locator.waitFor: Timeout 20000ms exceeded.
  30 |     await firstCard.click();
  31 |     await expect(page).toHaveURL(/\/product\//);
  32 |   });
  33 | });
  34 | 
```