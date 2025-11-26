import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TeamService } from '../../services/team.service';
import { Team } from '../../models/team.model';

@Component({
  selector: 'app-team-form',
  templateUrl: './team-form.component.html',
  styleUrl: './team-form.component.scss',
})
export class TeamFormComponent implements OnInit {
  form: FormGroup = this.formBuilder.group({
    dni: ['', Validators.required],
    name: ['', Validators.required],
    surname: ['', Validators.required],
    salary: ['', Validators.nullValidator],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly teamService: TeamService,
    private readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  ngOnInit(): void {
    if (this.dynamicDialogConfig.data.id) {
      const id = this.dynamicDialogConfig.data.id;
      this.teamService.getOne(id).subscribe((response: Team) => {
        this.form.patchValue(response);
      });
    }
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  buttonSaveTeam() {
    if (this.form) {
      const team = new Team(this.form.value);
      if (this.dynamicDialogConfig.data.id) {
        const id = this.dynamicDialogConfig.data.id;
        this.teamService.edit(id, team).subscribe({
          next: () => this.dynamicDialogRef.close(),
          error: () => {},
        });
      } else {
        this.teamService.create(team).subscribe({
          next: () => {
            this.dynamicDialogRef.close({ success: true });
            this.form.reset();
          },
          error: () => {},
        });
      }
    }
  }
}
