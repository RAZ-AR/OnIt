import { expect, test } from "@playwright/test";

test.describe("Service Menu & Personal Account", () => {
  test("switches niche template and adds a custom service in Меню услуг", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Меню услуг" }).click();

    await expect(page.getByRole("heading", { name: /Меню услуг/ })).toBeVisible();

    await page.getByRole("button", { name: /Сантехника/ }).click();
    await expect(page.getByText("Устранение протечки трубы")).toBeVisible();

    await page.getByLabel("Service name").fill("Установка фильтра воды");
    await page.getByLabel("Min price").fill("9000");
    await page.getByLabel("Max price").fill("12000");
    await page.getByRole("button", { name: "60 мин" }).click();
    await page.getByRole("button", { name: "Добавить", exact: true }).click();

    await expect(page.getByText("Установка фильтра воды", { exact: true })).toBeVisible();
  });

  test("edits Personal Account profile, working hours & AI settings with persistence", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Кабинет" }).click();

    await expect(page.getByRole("heading", { name: "Aram Petrosyan" })).toBeVisible();

    const companyInput = page.getByLabel(/Название компании/);
    await companyInput.fill("ArcticAir Yerevan");
    await expect(page.getByText(/цифровой ассистент ArcticAir Yerevan/)).toBeVisible();

    await page.getByRole("button", { name: "Время работы" }).click();
    await page.getByRole("button", { name: "Пн–Пт 09–18" }).click();
    await expect(page.getByText("5 дн/нед")).toBeVisible();

    await page.getByRole("button", { name: "AI, Зоны & GDPR" }).click();
    await page.getByRole("button", { name: "EU Vertex (Zero-Ret.)" }).click();

    // Reload and verify localStorage persistence
    await page.reload();
    await page.getByRole("button", { name: "Кабинет" }).click();
    await expect(page.getByText("5 дн/нед")).toBeVisible();
    await expect(page.getByText(/ArcticAir Yerevan/).first()).toBeVisible();
  });
});
