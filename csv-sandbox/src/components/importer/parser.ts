import Papa from 'papaparse';

export interface PreviewInfo {
  file: File;
  parseWarning?: Papa.ParseError;
  firstChunk: string;
  firstRows: string[][];
}

export type PreviewResults =
  | ({
      parseError: undefined;
    } & PreviewInfo)
  | {
      parseError: Error | Papa.ParseError;
    };

export const MAX_PREVIEW_ROWS = 5;

export type FieldAssignmentMap = { [name: string]: number | undefined };

export type BaseRow = { [name: string]: unknown };
export type ParseCallback<Row extends BaseRow> = (
  rows: Row[]
) => void | Promise<void>;

export function parsePreview(file: File): Promise<PreviewResults> {
  // wrap synchronous errors in promise
  return new Promise<PreviewResults>((resolve) => {
    let firstChunk: string | null = null;
    let firstWarning: Papa.ParseError | undefined = undefined;
    const rowAccumulator: string[][] = [];

    function reportSuccess() {
      resolve({
        file,
        parseError: undefined,
        parseWarning: firstWarning || undefined,
        firstChunk: firstChunk || '',
        firstRows: rowAccumulator
      });
    }

    // @todo true streaming support for local files (use worker?)
    Papa.parse(file, {
      chunkSize: 20000,
      preview: MAX_PREVIEW_ROWS,
      skipEmptyLines: true,
      error: (error) => {
        resolve({
          parseError: error
        });
      },
      beforeFirstChunk: (chunk) => {
        firstChunk = chunk;
      },
      chunk: ({ data, errors }, parser) => {
        data.forEach((row) => {
          rowAccumulator.push(
            (row as unknown[]).map((item) =>
              typeof item === 'string' ? item : ''
            )
          );
        });

        if (errors.length > 0 && !firstWarning) {
          firstWarning = errors[0];
        }

        // finish parsing after first chunk
        if (rowAccumulator.length < MAX_PREVIEW_ROWS) {
          parser.abort();
        }

        reportSuccess();
      },
      complete: reportSuccess
    });
  }).catch(() => {
    return {
      parseError: new Error('Internal error while generating preview')
    };
  });
}

export function processFile<Row extends BaseRow>(
  file: File,
  fieldAssignments: FieldAssignmentMap,
  reportProgress: (deltaCount: number) => void,
  callback: (rows: Row[]) => void | Promise<void>
): Promise<void> {
  const fieldNames = Object.keys(fieldAssignments);

  // wrap synchronous errors in promise
  return new Promise<void>((resolve, reject) => {
    // @todo true streaming support for local files (use worker?)
    Papa.parse(file, {
      chunkSize: 100,
      skipEmptyLines: true,
      error: (error) => {
        reject(error);
      },
      chunk: ({ data, errors }, parser) => {
        // pause to wait until the rows are consumed
        parser.pause();

        const rows = data.map((row) => {
          const stringRow = (row as unknown[]).map((item) =>
            typeof item === 'string' ? item : ''
          );

          const record = {} as { [name: string]: string | undefined };

          fieldNames.forEach((fieldName) => {
            const columnIndex = fieldAssignments[fieldName];
            if (columnIndex !== undefined) {
              record[fieldName] = stringRow[columnIndex];
            }
          });

          return record as Row; // @todo look into a more precise setup
        });

        // @todo collect errors
        reportProgress(rows.length);

        // wrap sync errors in promise
        const whenConsumed = new Promise<void>((resolve) =>
          resolve(callback(rows))
        );

        // unpause parsing when done
        whenConsumed.then(
          () => {
            parser.resume();
          },
          () => {
            // @todo collect errors
            parser.resume();
          }
        );
      },
      complete: () => {
        resolve();
      }
    });
  });
}
