declare module 'file-saver';

declare module "xlsx-populate/browser/xlsx-populate" {
  export interface Workbook {
    sheet(nameOrIndex: string | number): any;
    outputAsync(): Promise<ArrayBuffer>;
    toDataURL(): Promise<string>;
  }

  interface XlsxPopulateStatic {
    fromBlankAsync(): Promise<Workbook>;
    fromDataAsync(data: ArrayBuffer | Uint8Array | Buffer): Promise<Workbook>;
  }

  const XlsxPopulate: XlsxPopulateStatic;
  export default XlsxPopulate;
}

declare module "xlsx-populate" {
  export * from "xlsx-populate/browser/xlsx-populate";
  export { default } from "xlsx-populate/browser/xlsx-populate";
}

