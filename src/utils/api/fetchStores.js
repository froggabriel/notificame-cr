import axios from 'axios';

export const fetchStores = async (chainId, setStores, setError, PROXY_URL) => {
    try {
        if (chainId === 'chain1') {
            const response = await axios.get(`${PROXY_URL}/stores?chainId=${chainId}`);
            const storeData = response.data.data;
            const formattedStores = storeData.map(store => ({
                storeId: store.storeid,
                name: store.store
            }));
            setStores(formattedStores);
        } else if (chainId === 'chain2') {
            const response = await axios.post('https://www.pricesmart.com/api/ct/getProduct', [
                { skus: ["755713"] },
                { products: "getProductBySKU", metadata: { channelId: "5dc40d0e-e2c3-4c3b-9ed5-89fd11634e56" } }
            ], {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const product = response.data.data.products.results[0];
            if (product && product.masterData && product.masterData.current && product.masterData.current.masterVariant && product.masterData.current.masterVariant.availability && product.masterData.current.masterVariant.availability.channels && product.masterData.current.masterVariant.availability.channels.results) {
                const storeData = product.masterData.current.masterVariant.availability.channels.results;
                const formattedStores = storeData.map(store => ({
                    storeId: store.channel.id,
                    name: store.channel.nameAllLocales[0].value
                }));
                setStores(formattedStores);
            } else {
                setError('Error fetching stores. Please try again.');
            }
        }
    } catch (error) {
        console.error('Error fetching stores:', error);
        setError('Error fetching stores. Please try again.');
    }
};
