import { auth } from "@canva/user";
import axios from "axios";
import { CanvaUser, EmailConfiguration } from "src/models";

const API_BASE_URL = "https://api.mwf-idrisovanv.com/digest-canva/";

export const getCurrentUser = async () => {
    const token = await auth.getCanvaUserToken();

    const response = await axios.get(`${API_BASE_URL}user`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data as CanvaUser;
};

export const updateCurrentUserConfig = async (config: EmailConfiguration) => {
    const token = await auth.getCanvaUserToken();

    const response = await axios.post(`${API_BASE_URL}user`, config, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data as CanvaUser;
};