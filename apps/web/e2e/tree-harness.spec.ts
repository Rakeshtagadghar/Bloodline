import { expect, test } from "@playwright/test";

test.describe("Bloodline tree harness", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads fixture dataset and shows root node + details panel", async ({ page }) => {
    await expect(page.getByTestId("dataset-status")).toContainText("House Atlas");
    await expect(page.getByTestId("node-p_root")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Selected Person" })).toBeVisible();
    await expect(page.locator("#detail-name")).toHaveText("Rakesh I");

    await expect(page.locator(".stage-card")).toHaveScreenshot("tree-initial.png");
  });

  test("click node opens details and highlights relatives", async ({ page }) => {
    await page.getByTestId("node-p_child1").click();

    await expect(page.locator("#detail-name")).toHaveText("Aarav");
    await expect(page.getByTestId("node-p_root")).toHaveClass(/highlight/);
    await expect(page.getByTestId("node-p_grand")).toHaveClass(/highlight/);

    await expect(page.locator(".layout")).toHaveScreenshot("tree-selected-child1.png");
  });

  test("search filters nodes and selecting result centers target", async ({ page }) => {
    const viewportBefore = await page.getByTestId("viewport-readout").textContent();

    await page.getByPlaceholder("Search by name...").fill("nila");
    await expect(page.getByTestId("search-result-p_grand")).toBeVisible();
    await page.getByTestId("search-result-p_grand").click();

    await expect(page.locator("#detail-name")).toHaveText("Nila");
    await expect(page.getByTestId("node-p_root")).toHaveClass(/dimmed/);
    const viewportAfter = await page.getByTestId("viewport-readout").textContent();
    expect(viewportAfter).not.toBe(viewportBefore);

    await expect(page.locator(".stage-card")).toHaveScreenshot("tree-search-focus.png");
  });

  test("pan and zoom change transform state", async ({ page }) => {
    const stage = page.locator("#tree-stage");
    const before = await page.getByTestId("viewport-readout").textContent();

    await stage.dragTo(stage, {
      sourcePosition: { x: 300, y: 250 },
      targetPosition: { x: 430, y: 320 }
    });
    await stage.hover({ position: { x: 350, y: 300 } });
    await page.mouse.wheel(0, -220);

    const after = await page.getByTestId("viewport-readout").textContent();
    expect(after).not.toBe(before);
  });

  test("invalid dataset shows validation error panel", async ({ page }) => {
    await page.getByRole("button", { name: "Load Invalid" }).click();

    await expect(page.getByTestId("dataset-status")).toContainText("Invalid dataset");
    await expect(page.locator("#error-panel")).toBeVisible();
    await expect(page.locator("#error-list li")).toHaveCount(1);

    await expect(page.locator(".stage-card")).toHaveScreenshot("tree-invalid-dataset.png");
  });
});
