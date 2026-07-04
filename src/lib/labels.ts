export function serviceDirectionTitle(value: string) {
  switch (value) {
    case "MORNING":
      return "Sabah";
    case "EVENING":
      return "Akşam";
    case "NIGHT":
      return "Gece";
    case "OVERTIME":
      return "Mesai";
    case "ONE_OFF":
      return "Tek seferlik iş";
    default:
      return value;
  }
}

export function expenseCategoryTitle(value: string) {
  switch (value) {
    case "ADVANCE":
      return "Avans";
    case "FUEL":
      return "Yakıt";
    case "COMPANY_PROCESSING_FEE":
      return "Şirket işlem ücreti";
    case "SEAT_INSURANCE":
      return "Koltuk sigortası";
    case "FINE":
      return "Ceza";
    case "TAXI_FEE":
      return "Taksi ücreti";
    case "OTHER":
      return "Diğer";
    default:
      return value;
  }
}
