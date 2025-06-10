import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgForm, FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { User, UserService } from '../services/user.service';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { SidenavComponent } from '../shared/sidenav/sidenav.component';


@Component({
  selector: 'app-painel-administrativo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarComponent,
    SidenavComponent,
  ],
  templateUrl: './painel-administrativo.component.html',
  styleUrl: './painel-administrativo.component.scss'
})

export class PainelAdministrativoComponent implements OnInit, OnDestroy {
  userName: string | null = null;
  private userSubscription: Subscription | null = null;
  isSidenavVisible: boolean = false;
  users$!: Observable<User[]>; // Observable para a lista de usuários
  userForm: FormGroup; // Formulário para criar/editar usuários
  isEditMode = false; // Flag para controlar se o formulário está em modo de edição
  currentUserId: number | null = null; // Para guardar o ID do usuário sendo editado

  allAccessLevels = [
    { id: 1, name: 'ADMIN'},
    { id: 2, name: 'SUPERVISOR' },
    { id: 3, name: 'OPERADOR' }
  ];

  formAccessLevels = this.allAccessLevels.filter(level => level.id !== 1);

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.userForm = this.fb.group({
      nome: ['', Validators.required],
      senha: ['', Validators.required],
      nivel_acesso: [3, Validators.required] // Começa com 'OPERADOR' como padrão
    });
  }

    getAccessLevelName(levelId: number): string {
    const level = this.allAccessLevels.find(l => l.id === levelId);
    return level ? level.name : 'Desconhecido';
  }

  ngOnInit(): void{
    this.userSubscription = this.authService.userName$.subscribe(name => {
      this.userName = name;
    });
    this.loadUsers(); // Carrega a lista de usuários ao iniciar o componente
  }

  loadUsers(): void {
    this.users$ = this.userService.getUsers();
  }

  onSubmit(): void{
    if (this.userForm.invalid) {
      // Se o formulário for inválido, não faz nada
      return;
    }

    const userData: User = this.userForm.value;

    if (this.isEditMode && this.currentUserId) {
      // Modo Edição
      // Se o campo de senha estiver vazio na edição, não o enviamos para a API
      if (!userData.senha) {
        delete userData.senha;
      }
      this.userService.updateUser(this.currentUserId, userData).subscribe(() =>{
        this.resetFormAndReload();
      });
    } else {
      // Modo Cadastro
      this.userService.createUser(userData).subscribe(() => {
        this.resetFormAndReload();
      });
    }
  }

  editUser(user: User): void {
    this.isEditMode = true;
    this.currentUserId = user.id!;

    this.userForm.patchValue({
      nome: user.nome,
      nivel_acesso: user.nivel_acesso
    });
    // Torna o campo de senha opcional no modo de edição
    this.userForm.get('senha')?.clearValidators();
    this.userForm.get('senha')?.updateValueAndValidity();
  }

  // deleteUser(id: number): void {
  //   if (confirm('Tem certeza que deseja deletar este usuário?')) {
  //     this.userService.deleteUser(id).subscribe(() => {
  //       // Recarrega a lista após a exclusão
  //       this.loadUsers();
  //     });
  //   }
  // }

  resetFormAndReload(): void {
    this.userForm.reset({ nivel_acesso: 3}); //Reseta os campos do formulário
    this.isEditMode = false;
    this.currentUserId = null;

    //Readiciona a validação de 'required' para a senha (para o modo de cadastro)
    this.userForm.get('senha')?.setValidators([Validators.required]);
    this.userForm.get('senha')?.updateValueAndValidity();

    this.loadUsers();
  }

  handleToggleSidenavRequest(): void {
    this.isSidenavVisible = !this.isSidenavVisible;
  }

  handleCloseSidenavRequest(): void {
    this.isSidenavVisible = false;
  }

  ngOnDestroy(): void {
    if (this.userSubscription){
      this.userSubscription.unsubscribe();
    }
  }
}
