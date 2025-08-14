import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

// Argentina timezone
const ARG_TZ = 'America/Argentina/Buenos_Aires';

function formatDates(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(formatDates);
  } else if (obj && typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      // Detectar Date o string ISO
      if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/.test(value))) {
        newObj[key] = dayjs(value).tz(ARG_TZ).format('YYYY-MM-DD HH:mm:ss');
      } else {
        newObj[key] = formatDates(value);
      }
    }
    return newObj;
  }
  return obj;
}

@Injectable()
export class DateFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => formatDates(data))
    );
  }
}
