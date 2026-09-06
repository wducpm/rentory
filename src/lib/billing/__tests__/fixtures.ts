import type {
  BuildingSettings,
  Contract,
  ContractOccupant,
  Room,
} from "../types";

export const settings: BuildingSettings = {
  elec_price: 3800,
  water_price: 30000,
  internet_fee: 100000,
  common_fee: 150000,
};

export const contract: Contract = {
  id: "c1",
  rent: 4400000,
  deposit: 4400000,
};

/** BR-P15: số người tính phí = số dòng, nên fixture 2 người = 2 dòng. */
export const occupants: ContractOccupant[] = [
  { full_name: "Hồ Thị Trang", phone: "0912345678", is_primary: true },
  { full_name: "Nguyễn Văn B", phone: null, is_primary: false },
];

export const room = (elec: number, water: number): Room => ({
  id: "r1",
  code: "201",
  current_elec: elec,
  current_water: water,
});

export const amountOf = (
  items: { fee: string; amount: number }[],
  fee: string,
) => items.find((i) => i.fee === fee)!.amount;
