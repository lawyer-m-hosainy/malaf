import { Case, Deadline } from "@/types";

export interface CasesRepository {
  getCases(): Case[];
  saveCases(cases: Case[]): void;
  addDeadline(deadline: Deadline): void;
}

export class StoreCasesRepository implements CasesRepository {
  constructor(
    private readonly getCasesState: () => Case[],
    private readonly saveCasesState: (cases: Case[]) => void,
    private readonly addDeadlineState: (deadline: Deadline) => void,
    private readonly onCasesSaved?: (cases: Case[]) => Promise<void>
  ) {}

  getCases(): Case[] {
    return this.getCasesState();
  }

  saveCases(cases: Case[]): void {
    this.saveCasesState(cases);
    if (this.onCasesSaved) {
      void this.onCasesSaved(cases);
    }
  }

  addDeadline(deadline: Deadline): void {
    this.addDeadlineState(deadline);
  }
}
