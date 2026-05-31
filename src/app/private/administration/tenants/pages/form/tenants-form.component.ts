import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Tenant } from '../../models/tenants.model';
import { TenantsService } from '../../services/tenants.service';

@Component({
  selector: 'app-tenants-form',
  templateUrl: './tenants-form.component.html',
  styleUrl: './tenants-form.component.scss',
})
export class TenantsFormComponent implements OnInit {
  form: FormGroup = this.fb.group({
    // ── Tenant base ────────────────────────────────────────────────
    name: ['', [Validators.required, Validators.maxLength(100)]],

    // ── Identidad fiscal ───────────────────────────────────────────
    ruc:       ['', [Validators.maxLength(11)]],
    legalName: ['', [Validators.maxLength(191)]],
    tradeName: ['', [Validators.maxLength(191)]],

    // ── Dirección ──────────────────────────────────────────────────
    address:    ['', [Validators.maxLength(255)]],
    district:   ['', [Validators.maxLength(100)]],
    province:   ['', [Validators.maxLength(100)]],
    department: ['', [Validators.maxLength(100)]],

    // ── Contacto ───────────────────────────────────────────────────
    phone:   ['', [Validators.maxLength(30)]],
    email:   ['', [Validators.email, Validators.maxLength(191)]],
    website: ['', [Validators.maxLength(255)]],

    // ── Redes sociales ─────────────────────────────────────────────
    facebook:  ['', [Validators.maxLength(255)]],
    instagram: ['', [Validators.maxLength(255)]],
    tiktok:    ['', [Validators.maxLength(255)]],

    // ── Ticket ─────────────────────────────────────────────────────
    logoUrl:          ['', [Validators.maxLength(512)]],
    ticketFooterNote: ['', [Validators.maxLength(255)]],
  });

  get isValid(): boolean { return this.form.valid; }
  get isEdit(): boolean  { return !!this.dynamicDialogConfig.data?.id; }

  constructor(
    private readonly fb: FormBuilder,
    private readonly tenantsService: TenantsService,
    readonly dynamicDialogRef: DynamicDialogRef,
    private readonly dynamicDialogConfig: DynamicDialogConfig,
  ) {}

  ngOnInit(): void {
    const id = this.dynamicDialogConfig.data?.id as number | undefined;
    if (!id) return;

    forkJoin({
      tenant:  this.tenantsService.getOne(id),
      setting: this.tenantsService.getSettings(id).pipe(catchError(() => of(null))),
    }).subscribe(({ tenant, setting }) => {
      this.form.patchValue({
        name:             tenant.name,
        ruc:              setting?.ruc              ?? '',
        legalName:        setting?.legalName        ?? '',
        tradeName:        setting?.tradeName        ?? '',
        address:          setting?.address          ?? '',
        district:         setting?.district         ?? '',
        province:         setting?.province         ?? '',
        department:       setting?.department       ?? '',
        phone:            setting?.phone            ?? '',
        email:            setting?.email            ?? '',
        website:          setting?.website          ?? '',
        facebook:         setting?.socialLinks?.facebook  ?? '',
        instagram:        setting?.socialLinks?.instagram ?? '',
        tiktok:           setting?.socialLinks?.tiktok    ?? '',
        logoUrl:          setting?.logoUrl          ?? '',
        ticketFooterNote: setting?.ticketFooterNote ?? '',
      });
    });
  }

  save(): void {
    if (!this.form.valid) return;

    const v   = this.form.value;
    const id  = this.dynamicDialogConfig.data?.id as number | undefined;

    const settingPayload = {
      ruc:              v.ruc              || null,
      legalName:        v.legalName        || null,
      tradeName:        v.tradeName        || null,
      address:          v.address          || null,
      district:         v.district         || null,
      province:         v.province         || null,
      department:       v.department       || null,
      phone:            v.phone            || null,
      email:            v.email            || null,
      website:          v.website          || null,
      socialLinks: {
        facebook:  v.facebook  || null,
        instagram: v.instagram || null,
        tiktok:    v.tiktok    || null,
      },
      logoUrl:          v.logoUrl          || null,
      ticketFooterNote: v.ticketFooterNote || null,
    };

    if (id) {
      // Edición: actualizar nombre + settings en paralelo
      forkJoin({
        tenant:  this.tenantsService.edit(id, { name: v.name as string }),
        setting: this.tenantsService.saveSettings(id, settingPayload),
      }).subscribe({
        next: () => this.dynamicDialogRef.close({ success: true }),
        error: () => this.dynamicDialogRef.close({ error: 'Error al guardar.' }),
      });
    } else {
      // Creación: primero crear tenant, luego guardar settings
      this.tenantsService
        .createAndReturn({ name: v.name as string })
        .pipe(
          catchError(err => { throw err; }),
        )
        .subscribe({
          next: (tenant: Tenant) => {
            this.tenantsService.saveSettings(tenant.id, settingPayload).subscribe({
              next: () => this.dynamicDialogRef.close({ success: true }),
              error: () => this.dynamicDialogRef.close({ success: true, warn: 'Tenant creado, pero no se guardaron los ajustes.' }),
            });
          },
          error: () => this.dynamicDialogRef.close({ error: 'Error al crear el tenant.' }),
        });
    }
  }
}
