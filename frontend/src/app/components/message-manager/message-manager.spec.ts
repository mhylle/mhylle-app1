import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageManager } from './message-manager';

describe('MessageManager', () => {
  let component: MessageManager;
  let fixture: ComponentFixture<MessageManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
