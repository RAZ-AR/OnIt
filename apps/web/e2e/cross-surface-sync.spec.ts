import { expect, test } from "@playwright/test";

test.describe("Cross-Surface Live Sync (WhatsApp -> Telegram Mini App -> Web)", () => {
  test("client WhatsApp quote & slot booking syncs live into Telegram Mini App and Web", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Open Client WhatsApp simulator
    await page.getByRole("button", { name: /Client WhatsApp/ }).click();
    await page.getByRole("button", { name: /Кондиционер течёт и не холодит/ }).click();

    // Deterministic @onit/core quote + geo slots appear
    await expect(page.getByText(/18 000 – 22 000 AMD/).first()).toBeVisible();
    await page.getByRole("button", { name: /Завтра 11:30/ }).click();
    await expect(page.getByText(/Визит мастера закреплён на Завтра 11:30/)).toBeVisible();

    // 2. Switch to Web Dispatch -> new job count increased from 4 to 5
    await page.getByRole("button", { name: /Web Dispatch/ }).click();
    await expect(page.getByRole("heading", { name: "Заказы сегодня (5)" })).toBeVisible();

    // 3. Switch to Telegram Mini App -> also reflects 5 jobs
    await page.getByRole("button", { name: /Telegram Mini App/ }).click();
    await expect(page.getByText("Вторник · 5 заказа")).toBeVisible();
  });
});
