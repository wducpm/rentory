import type { BuildingSettings, Contract, Room } from "../types";

export const settings: BuildingSettings = {
  elec_price: 3800,
  water_price: 30000,
  internet_fee: 100000,
  common_fee: 150000,
};

export const contract: Contract = {
  id: "c1",
  rent: 4400000,
  occupants: 2,
  deposit: 4400000,
};

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
