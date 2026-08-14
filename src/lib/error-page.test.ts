import { describe, expect, it } from "vitest";

import { renderErrorPage } from "./error-page";

describe("renderErrorPage", () => {
  it("escapes reference IDs and includes narrow-screen safeguards", () => {
    const page = renderErrorPage('<unsafe id="1">');

    expect(page).toContain("Reference: &lt;unsafe id=&quot;1&quot;&gt;");
    expect(page).toContain("min-height: 100dvh");
    expect(page).toContain("overflow-wrap: anywhere");
    expect(page).toContain("@media (max-width: 320px)");
  });
});
