import { expect, test } from "@playwright/test";

test.describe("Web Dispatch Core Flows", () => {
  test("renders Web Dispatch with left sidebar only (no bottom dock) and zero errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "14.04" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Заказы сегодня (4)" })).toBeVisible();

    // Left sidebar navigation exists
    await expect(page.getByRole("button", { name: "Меню услуг" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Кабинет" })).toBeVisible();

    // Bottom iOS Island Dock must NOT appear on Web
    await expect(page.getByRole("navigation", { name: "OnIt iOS Island Dock" })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("header language switcher switches UI across RU/HY/EN/ES and persists after reload", async ({
    page,
  }) => {
    await page.goto("/");
    const switcher = page.getByRole("group", { name: "Interface language switcher" });
    await expect(switcher).toBeVisible();

    await switcher.getByRole("button", { name: "en", exact: true }).click();
    await expect(page.getByRole("button", { name: "Service Menu" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Today's Jobs (4)" })).toBeVisible();

    await switcher.getByRole("button", { name: "hy", exact: true }).click();
    await expect(page.getByRole("button", { name: "Կաբինետ" })).toBeVisible();

    await switcher.getByRole("button", { name: "es", exact: true }).click();
    await expect(page.getByRole("button", { name: "Menú servicios" })).toBeVisible();

    // Reload and verify language persisted in localStorage
    await page.reload();
    await expect(page.getByRole("button", { name: "Menú servicios" })).toBeVisible();
  });

  test("creates a new order from embedded Yerevan streets & equipment catalogs", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Новый заказ" }).click();

    await expect(page.getByText("Создать заказ с авто-сметой")).toBeVisible();
    await page.getByLabel("Search Yerevan street").fill("Комитас");
    await page.getByRole("button", { name: /пр. Комитаса/ }).click();

    await page.getByLabel("Search equipment model").fill("Daikin");
    await page.getByRole("button", { name: /^Daikin Sensira/ }).click();

    await page.getByRole("button", { name: "Создать", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Заказы сегодня (5)" })).toBeVisible();
  });

  test("builds and sends a client invoice with % surcharge, fixed surcharge & discount", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Заправка фреоном \+ дренаж/ }).click();

    await expect(page.getByText("LG DualCool S12EQ (12000 BTU)")).toBeVisible();
    await page.getByRole("button", { name: /Выставить инвойс клиенту/ }).click();

    await expect(page.getByRole("heading", { name: /Счёт для Ани С\./ })).toBeVisible();

    // Base is 18 000 AMD -> +20% (+3 600) + 5 000 - 2 000 = 24 600 AMD
    await page.getByRole("button", { name: /Сложность доступа/ }).click();
    await page.getByRole("button", { name: /Негабарит/ }).click();
    await page.getByRole("button", { name: /Скидка мастера/ }).click();

    await expect(page.getByText("24 600 AMD")).toBeVisible();

    await page.getByRole("button", { name: "Отправить клиенту" }).click();

    // Switch to Client WhatsApp and verify the invoice message arrived
    await page.getByRole("button", { name: /Client WhatsApp/ }).click();
    await expect(page.getByText(/ИТОГО К ОПЛАТЕ: 24 600 AMD/)).toBeVisible();
  });
});
