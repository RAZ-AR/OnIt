import type { GeoPoint } from "../schemas/channel.js";

export interface EquipmentModelRef {
  id: string;
  brand: string;
  model: string;
  category: "hvac" | "washing_machine" | "boiler" | "refrigerator";
  capacityLabel: string;
  refrigerant?: string;
  inverter: boolean;
  commonFaults: string[];
  requiredTools: string[];
  commonParts: string[];
  defaultServiceCodes: string[];
}

export interface StreetRef {
  id: string;
  nameRu: string;
  nameHy: string;
  nameEn: string;
  district: "Kentron" | "Arabkir" | "Avan" | "Erebuni" | "Davtashen" | "Malatia" | "Nor Nork";
  point: GeoPoint;
  landmark?: string;
}

export const EQUIPMENT_MODELS: EquipmentModelRef[] = [
  {
    id: "lg_dualcool_s12eq",
    brand: "LG",
    model: "DualCool S12EQ",
    category: "hvac",
    capacityLabel: "12000 BTU",
    refrigerant: "R32",
    inverter: true,
    commonFaults: ["Обмерзание трубки", "Утечка фреона", "Засор дренажа", "Ошибка CH05"],
    requiredTools: ["Манометр R32", "Вакуумный насос", "Парогенератор"],
    commonParts: ["Фреон R32 (0.7 кг)", "Дренажная трубка 16мм", "Датчик термистор"],
    defaultServiceCodes: ["ac_freon_refill", "ac_drainage_clean"],
  },
  {
    id: "midea_mission_12",
    brand: "Midea",
    model: "Mission II MSMA-12HRN1",
    category: "hvac",
    capacityLabel: "12000 BTU",
    refrigerant: "R410A",
    inverter: false,
    commonFaults: ["Капает внутренний блок", "Слабый холод", "Шум крыльчатки"],
    requiredTools: ["Манометр R410A", "Мойка высокого давления", "Чехол для мойки"],
    commonParts: ["Фреон R410A", "Конденсатор пусковой 35мкФ"],
    defaultServiceCodes: ["ac_full_maintenance"],
  },
  {
    id: "gree_bora_09",
    brand: "Gree",
    model: "Bora GWH09AAA",
    category: "hvac",
    capacityLabel: "9000 BTU",
    refrigerant: "R410A",
    inverter: false,
    commonFaults: ["Забит дренаж", "Запах сырости", "Низкое давление"],
    requiredTools: ["Парогенератор", "Антибактериальный спрей", "Мультиметр"],
    commonParts: ["Дренажный сифон", "Фильтр-сетка"],
    defaultServiceCodes: ["ac_drainage_clean"],
  },
  {
    id: "daikin_sensira_35",
    brand: "Daikin",
    model: "Sensira FTXF35C",
    category: "hvac",
    capacityLabel: "12000 BTU",
    refrigerant: "R32",
    inverter: true,
    commonFaults: ["Пробой платы инвертора", "Ошибка U4", "Выбивает автомат"],
    requiredTools: ["Мультиметр TrueRMS", "Токовые клещи", "Набор диэлектрический"],
    commonParts: ["Плата наружного блока PCB", "Термопредохранитель"],
    defaultServiceCodes: ["ac_diagnostics"],
  },
  {
    id: "samsung_windfree_12",
    brand: "Samsung",
    model: "WindFree AR12TXHQ",
    category: "hvac",
    capacityLabel: "12000 BTU",
    refrigerant: "R32",
    inverter: true,
    commonFaults: ["Загрязнение микроперфорации", "Ошибка E101", "Течь помпы"],
    requiredTools: ["Парогенератор", "Набор шестигранников", "Манометр R32"],
    commonParts: ["Дренажная помпа Mini", "Фреон R32"],
    defaultServiceCodes: ["ac_full_maintenance"],
  },
  {
    id: "haier_tundra_18",
    brand: "Haier",
    model: "Tundra AS18TD2HRA",
    category: "hvac",
    capacityLabel: "18000 BTU",
    refrigerant: "R32",
    inverter: true,
    commonFaults: ["Не хватает мощности охлаждения", "Вибрация наружного блока"],
    requiredTools: ["Манометр R32", "Виброопоры", "Динамометрический ключ"],
    commonParts: ["Комплект виброопор", "Фреон R32"],
    defaultServiceCodes: ["ac_freon_refill"],
  },
];

export const YEREVAN_STREETS: StreetRef[] = [
  { id: "tumanyan", nameRu: "ул. Туманяна", nameHy: "Թումանյան փ.", nameEn: "Tumanyan St", district: "Kentron", point: { lat: 40.1811, lng: 44.5136 }, landmark: "возле Оперы" },
  { id: "abovyan", nameRu: "ул. Абовяна", nameHy: "Աբովյան փ.", nameEn: "Abovyan St", district: "Kentron", point: { lat: 40.1845, lng: 44.5189 }, landmark: "м. Еритасардакан" },
  { id: "mashtots", nameRu: "пр. Маштоца", nameHy: "Մաշտոցի պ.", nameEn: "Mashtots Ave", district: "Kentron", point: { lat: 40.1832, lng: 44.5094 }, landmark: "Крытый рынок" },
  { id: "saryan", nameRu: "ул. Сарьяна", nameHy: "Սարյան փ.", nameEn: "Saryan St", district: "Kentron", point: { lat: 40.1849, lng: 44.5062 }, landmark: "Винная улица" },
  { id: "northern_ave", nameRu: "Северный проспект", nameHy: "Հյուսիսային պ.", nameEn: "Northern Ave", district: "Kentron", point: { lat: 40.1819, lng: 44.5152 }, landmark: "Центр" },
  { id: "nalbandyan", nameRu: "ул. Налбандяна", nameHy: "Նալբանդյան փ.", nameEn: "Nalbandyan St", district: "Kentron", point: { lat: 40.1798, lng: 44.5178 }, landmark: "пл. Республики" },
  { id: "komitas", nameRu: "пр. Комитаса", nameHy: "Կոմիտասի պ.", nameEn: "Komitas Ave", district: "Arabkir", point: { lat: 40.2038, lng: 44.5152 }, landmark: "Ереван Сити" },
  { id: "baghramyan", nameRu: "пр. Баграмяна", nameHy: "Բաղրամյան պ.", nameEn: "Baghramyan Ave", district: "Arabkir", point: { lat: 40.1932, lng: 44.5059 }, landmark: "м. Баграмян" },
  { id: "kievyan", nameRu: "ул. Киевян", nameHy: "Կիևյան փ.", nameEn: "Kievyan St", district: "Arabkir", point: { lat: 40.1965, lng: 44.4926 }, landmark: "м. Барэкамутюн" },
  { id: "hrachya_kochar", nameRu: "ул. Грачья Кочара", nameHy: "Հրաչյա Քոչարի փ.", nameEn: "Hrachya Kochar St", district: "Arabkir", point: { lat: 40.2012, lng: 44.5015 }, landmark: "Рио Молл" },
  { id: "acharyan", nameRu: "ул. Ачаряна", nameHy: "Աճառյան փ.", nameEn: "Acharyan St", district: "Avan", point: { lat: 40.2144, lng: 44.5681 }, landmark: "Ботанический сад" },
  { id: "tsarav_aghbyur", nameRu: "ул. Царав Ахбюр", nameHy: "Ծարավ Աղբյուրի փ.", nameEn: "Tsarav Aghbyur St", district: "Avan", point: { lat: 40.2211, lng: 44.5734 }, landmark: "Аван новостройки" },
  { id: "erebuni", nameRu: "ул. Эребуни", nameHy: "Էրեբունու փ.", nameEn: "Erebuni St", district: "Erebuni", point: { lat: 40.1352, lng: 44.5191 }, landmark: "Эребуни Молл" },
  { id: "tigran_mets", nameRu: "пр. Тиграна Меца", nameHy: "Տիգրան Մեծի պ.", nameEn: "Tigran Mets Ave", district: "Erebuni", point: { lat: 40.1654, lng: 44.5171 }, landmark: "м. Зоравар Андраник" },
  { id: "davtashen_2", nameRu: "Давташен 2-й квартал", nameHy: "Դավթաշեն 2-րդ թաղ.", nameEn: "Davtashen 2nd Block", district: "Davtashen", point: { lat: 40.2188, lng: 44.4878 }, landmark: "парк Давташен" },
  { id: "gai", nameRu: "пр. Гайи", nameHy: "Գայի պ.", nameEn: "Gai Ave", district: "Nor Nork", point: { lat: 40.1972, lng: 44.5649 }, landmark: "Мегамолл" },
  { id: "sebastia", nameRu: "ул. Себастия", nameHy: "Սեբաստիայի փ.", nameEn: "Sebastia St", district: "Malatia", point: { lat: 40.1755, lng: 44.4552 }, landmark: "Малатия" },
];

export function searchStreets(query: string, limit = 6): StreetRef[] {
  const q = query.trim().toLowerCase();
  if (!q) return YEREVAN_STREETS.slice(0, limit);
  return YEREVAN_STREETS.filter(
    (s) =>
      s.nameRu.toLowerCase().includes(q) ||
      s.nameHy.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.district.toLowerCase().includes(q) ||
      (s.landmark?.toLowerCase().includes(q) ?? false)
  ).slice(0, limit);
}

export function searchEquipmentModels(query: string, limit = 6): EquipmentModelRef[] {
  const q = query.trim().toLowerCase();
  if (!q) return EQUIPMENT_MODELS.slice(0, limit);
  return EQUIPMENT_MODELS.filter(
    (m) =>
      m.brand.toLowerCase().includes(q) ||
      m.model.toLowerCase().includes(q) ||
      (m.refrigerant?.toLowerCase().includes(q) ?? false) ||
      m.commonFaults.some((f) => f.toLowerCase().includes(q))
  ).slice(0, limit);
}

export function getEquipmentById(id?: string): EquipmentModelRef | undefined {
  return EQUIPMENT_MODELS.find((m) => m.id === id);
}
