import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class OrderFormComponent implements OnInit {
  orderId: number = 0;
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    if (this.route.snapshot.paramMap.get('id')) {
      this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    }
  }

  ngOnInit(): void {
    console.log(this.orderId);
  }
}
