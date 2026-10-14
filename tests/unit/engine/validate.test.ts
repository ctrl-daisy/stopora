import { describe, it, expect } from "vitest";
import { validateMatrix } from "@/lib/engine/validate";

describe("Matrix validation (validateMatrix)", () => {
  it("throws clear error on empty matrix", () => {
    expect(() => validateMatrix([])).toThrowError(/empty/i);
    // @ts-expect-error testing null input
    expect(() => validateMatrix(null)).toThrowError(/empty/i);
  });

  it("throws clear error on non-square matrix", () => {
    const nonSquareRow = [
      [0, 10, 20],
      [10, 0],
      [20, 15, 0],
    ];
    expect(() => validateMatrix(nonSquareRow)).toThrowError(/square/i);

    const nonSquareCol = [
      [0, 10],
      [10, 0],
      [20, 30],
    ];
    expect(() => validateMatrix(nonSquareCol)).toThrowError(/square/i);
  });

  it("throws clear error when points exceed 51", () => {
    const size = 52;
    const bigMatrix = Array.from({ length: size }, () =>
      new Array(size).fill(10)
    );
    for (let i = 0; i < size; i++) bigMatrix[i][i] = 0;

    expect(() => validateMatrix(bigMatrix)).toThrowError(/51/);
  });

  it("throws clear error on negative values", () => {
    const matrix = [
      [0, -5],
      [10, 0],
    ];
    expect(() => validateMatrix(matrix)).toThrowError(/negative/i);
  });

  it("throws clear error on NaN values", () => {
    const matrix = [
      [0, NaN],
      [10, 0],
    ];
    expect(() => validateMatrix(matrix)).toThrowError(/NaN/i);
  });

  it("throws clear error on Infinity values", () => {
    const matrix = [
      [0, Infinity],
      [10, 0],
    ];
    expect(() => validateMatrix(matrix)).toThrowError(/Infinity/i);

    const negInfMatrix = [
      [0, -Infinity],
      [10, 0],
    ];
    expect(() => validateMatrix(negInfMatrix)).toThrowError(/(negative|Infinity)/i);
  });

  it("accepts valid symmetric and asymmetric matrices up to 51 points", () => {
    const symmetric = [
      [0, 15],
      [15, 0],
    ];
    expect(() => validateMatrix(symmetric)).not.toThrow();

    const asymmetric = [
      [0, 12, 30],
      [18, 0, 22],
      [25, 40, 0],
    ];
    expect(() => validateMatrix(asymmetric)).not.toThrow();

    const maxValid = Array.from({ length: 51 }, () => new Array(51).fill(5));
    for (let i = 0; i < 51; i++) maxValid[i][i] = 0;
    expect(() => validateMatrix(maxValid)).not.toThrow();
  });
});
