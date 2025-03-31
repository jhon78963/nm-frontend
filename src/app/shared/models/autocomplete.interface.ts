export interface AutocompleteResponse {
  id: number;
  value: string;
}

export interface AutocompleteSaveResponse {
  message: string;
  item: AutocompleteResponse;
}
