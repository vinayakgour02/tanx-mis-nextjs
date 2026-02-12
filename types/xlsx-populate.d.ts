declare module "xlsx-populate/browser/xlsx-populate" {
  interface Cell {
    value(val?: any): any;
    dataValidation(config: any): Cell;
    style(config: any): Cell;
  }

  interface Sheet {
    name(name?: string): Sheet;
    row(row: number): Sheet;
    column(col: string | number): Sheet;
    cell(row: number, col: number | string): Cell;
  }

  interface Workbook {
    sheet(index: number): Sheet;
    addSheet(name: string): Sheet;
    outputAsync(): Promise<Blob>;
  }

  const XlsxPopulate: {
    fromBlankAsync(): Promise<Workbook>;
    fromDataAsync(data: ArrayBuffer | Uint8Array): Promise<Workbook>; // ✅ add this
  };

  export default XlsxPopulate;
}
