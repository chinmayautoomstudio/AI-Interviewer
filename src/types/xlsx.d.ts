declare module 'xlsx' {
  export interface WorkSheet {
    [cell: string]: any;
    '!cols'?: Array<{ wch?: number; wpx?: number; wpt?: number }>;
    '!rows'?: Array<{ hpt?: number; hpx?: number }>;
    '!merges'?: Array<any>;
    '!ref'?: string;
  }

  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheet: string]: WorkSheet };
    Props?: {
      Title?: string;
      Subject?: string;
      Author?: string;
      CreatedDate?: Date;
    };
  }

  export interface XLSX$Utils {
    json_to_sheet<T>(data: T[], opts?: any): WorkSheet;
    sheet_to_json<T>(worksheet: WorkSheet, opts?: any): T[];
    book_new(): WorkBook;
    book_append_sheet(workbook: WorkBook, worksheet: WorkSheet, name: string): void;
  }

  export function writeFile(workbook: WorkBook, filename: string, opts?: any): void;

  export const utils: XLSX$Utils;
  export const version: string;
}

