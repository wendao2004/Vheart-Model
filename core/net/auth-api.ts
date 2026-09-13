import { callCloud } from "./http";
import type {
	LoginRequestDTO,
	LoginResponseDTO,
	RegisterRequestDTO,
	CloudResult,
	UserInfiDTO
} from '../bean';

export class AuthApi {
	static login(params : LoginRequestDTO) : Promise<CloudResult<LoginResponseDTO>> {
		const payload : UTSJSONObject = { phoneNumber: params.phoneNumber, password: params.password };
		return callCloud<LoginResponseDTO>('Vheart-Model', 'auth/login', payload);
	}

	static register(params : RegisterRequestDTO) : Promise<CloudResult<UserInfiDTO>> {
		const payload : UTSJSONObject = { phoneNumber: params.phoneNumber, password: params.password };
		return callCloud<UserInfiDTO>('Vheart-Model', 'auth/register', payload);
	}
}
