import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from './interfaces/jwt_payload.interface';
import { User } from './entities/user.entity';
import { LoginResponse } from './interfaces/login_response.interface';
import { CreateUserDto, UpdateAuthDto, LoginDto, RegisterUserDto } from './dto/index';

@Injectable()
export class AuthService {

  constructor(@InjectModel(User.name) private userModel: Model<User>,
              private jwtService: JwtService) {}

  async create(createUserDto: CreateUserDto) : Promise<User> {

    try {
      const { password, ...userData } = createUserDto;
      //1-Encriptar la contraseña
      const newUser = new this.userModel({
        password : bcrypt.hashSync(password,10),
        ...userData
      })
      //2-Guardar el usuario
      await newUser.save();
      //3-Eliminar la contraseña de la data que se muestra como respuesta al crear un usuario
      const { password:_, ...user } = newUser.toJSON();
      return user;
      //3-Generar JWT
      
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(`${createUserDto.email} already exists`);
      }
      throw new InternalServerErrorException('Something terrible happend');
    }
  }

  async register(registerUserDto : RegisterUserDto) : Promise<LoginResponse>{

    const user = await this.create(registerUserDto);

    return {
      user : user,
      token : this.getJWT({id: user._id})
    }
  }

  async login(loginDto : LoginDto) : Promise<LoginResponse>{

    const {password, email} = loginDto;

    const user = await this.userModel.findOne({email});

    if (!user) {
      throw new UnauthorizedException('Invalid credentials - email');
    }

    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Invalid credentials - password');
    }

    const {password:_,...rest} = user.toJSON();

    return {
      user : rest,
      token : this.getJWT({ id : user.id })
    };
  }

  findAll() {
    return this.userModel.find();
  }

  async findUserById( id: number){
    const user = this.userModel.findById(id);
    const {password, ...rest} = (await user).toJSON();
    return rest;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  getJWT( payload: JwtPayload ){
    return this.jwtService.sign(payload);
  }

  checkToken
}
