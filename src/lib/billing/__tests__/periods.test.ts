import { describe, expect, it } from "vitest";
import { derivePeriods, invoiceMonth, nextPeriod, prevPeriod } from "../periods";

describe("invoiceMonth — tháng gọi tên hóa đơn", () => {
  it("hóa đơn tháng M = điện nước M−1 + dịch vụ M", () => {
    // Chốt cuối tháng 8 → điện nước T8, dịch vụ T9 → gọi là hóa đơn tháng 9
    const periodic = derivePeriods("periodic", "2026-08-31");
    expect(periodic).toEqual({
      utility_period: "2026-08",
      service_period: "2026-09",
    });
    expect(invoiceMonth(periodic)).toBe("2026-09");
    expect(prevPeriod(invoiceMonth(periodic)!)).toBe(periodic.utility_period);
  });

  it("nhận phòng lấy kỳ dịch vụ", () => {
    const moveIn = derivePeriods("move_in", "2026-09-07");
    expect(moveIn.utility_period).toBeNull();
    expect(invoiceMonth(moveIn)).toBe("2026-09");
  });

  it("trả phòng chỉ có kỳ điện nước → suy ra tháng liền sau", () => {
    // HD-03: dịch vụ đã thu ở kỳ trước nên service_period null. Số điện tháng 9
    // được chốt và thu trong hóa đơn tháng 10.
    const moveOut = derivePeriods("move_out", "2026-09-20");
    expect(moveOut.service_period).toBeNull();
    expect(invoiceMonth(moveOut)).toBe("2026-10");
  });

  it("không có kỳ nào thì không gọi tên được", () => {
    expect(invoiceMonth({ utility_period: null, service_period: null })).toBeNull();
  });

  it("bắc qua giao thừa", () => {
    expect(invoiceMonth({ utility_period: "2026-12", service_period: null })).toBe(
      "2027-01",
    );
    expect(nextPeriod("2026-12")).toBe("2027-01");
    expect(prevPeriod("2027-01")).toBe("2026-12");
  });
});
