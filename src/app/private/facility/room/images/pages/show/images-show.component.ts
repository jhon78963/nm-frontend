import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Image } from '../../models/images.model';

@Component({
  selector: 'app-images-show',
  standalone: true,
  imports: [],
  templateUrl: './images-show.component.html',
  styleUrl: './images-show.component.scss',
})
export class ImagesShowComponent implements OnInit {
  image: Image | undefined;

  constructor(private readonly dynamicDialogConfig: DynamicDialogConfig) {}

  ngOnInit(): void {
    this.image = this.dynamicDialogConfig.data.image;
  }
}
