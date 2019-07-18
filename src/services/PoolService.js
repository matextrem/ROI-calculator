import axios from 'axios';

const PoolService = {
    get: async () => {
        const config = {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token'
            }
        };
        const response = await axios.get(`https://uniswap-roi.herokuapp.com/pool_ranking/?days=60`, config);
        return response;
    }
}

export default PoolService;