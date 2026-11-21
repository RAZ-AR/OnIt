import { expect, test } from "@playwright/test";

test.describe("Telegram Mini App (/tma)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders standalone /tma with iOS Island Dock, header language toggle, photo detail & calendar", async ({
    page,
  }) => {
    await page.goto("/tma");

    // Floating iOS Island Dock is visible on mobile /tma
    const dock = page.getByRole("navigation", { name: "Telegram Mini App Dock" });
    await expect(dock).toBeVisible();

    // Header compact language switcher cycles RU -> HY -> EN
    const langBtn = page.getByRole("button", { name: "Switch interface language" });
    await expect(langBtn).toBeVisible();
    await langBtn.click(); // HY
    await langBtn.click(); // EN
    await expect(page.getByRole("button", { name: "Calendar" }).first()).toBeVisible();
    await langBtn.click(); // ES
    await langBtn.click(); // RU

    // Tap first big order card -> opens Photo / Spec detail window
    await page.getByRole("button", { name: /Заправка фреоном \+ дренаж/ }).click();
    await expect(page.getByText("LG DualCool S12EQ (12000 BTU)")).toBeVisible();
    await expect(page.getByRole("button", { name: "AI Box" })).toBeVisible();

    // Open Quote tab & Invoice Sheet
    await page.getByRole("button", { name: "Смета" }).click();
    await page.getByRole("button", { name: /Выставить инвойс/ }).click();
    await expect(page.getByRole("heading", { name: /Счёт для Ани С\./ })).toBeVisible();
    await page.getByRole("button", { name: "Close invoice sheet" }).click();

    // Navigate back & open Calendar day cards
    await page.getByRole("button", { name: "Назад" }).click();
    await dock.getByRole("button", { name: "Календарь" }).click();
    await expect(page.getByText("АПР", { exact: true }).first()).toBeVisible();
  });
});
