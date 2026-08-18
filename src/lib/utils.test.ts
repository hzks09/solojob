import { describe, expect, it } from "vitest";
import { formatDuration } from "./utils";

describe("formatDuration", () => {
  it("formate les durées de moins d'une heure en m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(9)).toBe("0:09");
    expect(formatDuration(59)).toBe("0:59");
    expect(formatDuration(60)).toBe("1:00");
    expect(formatDuration(3599)).toBe("59:59");
  });

  it("passe en h:mm:ss à partir d'une heure", () => {
    expect(formatDuration(3600)).toBe("1:00:00");
    expect(formatDuration(3661)).toBe("1:01:01");
    expect(formatDuration(7325)).toBe("2:02:05");
  });

  it("ramène une entrée négative à zéro plutôt que de produire un affichage cassé", () => {
    // Avant normalisation, -5 produisait "-1:-5".
    expect(formatDuration(-5)).toBe("0:00");
    expect(formatDuration(-3600)).toBe("0:00");
  });

  it("tronque une entrée non entière", () => {
    // Avant normalisation, 90.7 produisait "1:30.7".
    expect(formatDuration(90.7)).toBe("1:30");
    expect(formatDuration(59.999)).toBe("0:59");
  });

  it("ne casse pas sur une valeur non finie", () => {
    expect(formatDuration(Number.NaN)).toBe("0:00");
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("0:00");
  });
});
