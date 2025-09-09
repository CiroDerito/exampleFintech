import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosError } from 'axios';

export function throwNestHttpFromAxios(e: any, fallbackMsg = 'Error externo') {
  const err = e as AxiosError<any>;
  const status = err.response?.status;
  const message =
    err.response?.data?.error?.message ||
    err.response?.data?.message ||
    err.message ||
    fallbackMsg;

  switch (status) {
    case 400: throw new BadRequestException(message);
    case 401: throw new UnauthorizedException(message);
    case 403: throw new ForbiddenException(message);
    case 404: throw new NotFoundException(message);
    case undefined:
      // Sin respuesta (timeout / red de salida)
      throw new InternalServerErrorException(message);
    default:
      throw new HttpException(message, status);
  }
}
