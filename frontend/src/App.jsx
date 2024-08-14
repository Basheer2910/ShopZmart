/* eslint-disable no-undef */
import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [productName, setProductName] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    chrome.storage.sync.get(['products', 'productName'], function (result) {
      if (result?.products && result?.productName) {
        setProducts(result.products);
        setProductName(result.productName);
      }
    });
    setLoading(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let flipkartProducts = [];
    let amazonProducts = [];
    try {
      const flipkartOptions = {
        method: 'GET',
        url: 'https://real-time-flipkart-api.p.rapidapi.com/product-search',
        params: {
          q: productName,
          page: '1',
          sort_by: 'popularity'
        },
        headers: {
          //'x-rapidapi-key': include your Key provided by Rapid API,
          'x-rapidapi-host': 'real-time-flipkart-api.p.rapidapi.com'
        }
      };
      console.log(flipkartOptions);
      const flipkartResponse = await axios.request(flipkartOptions);
      console.log("Flipkart Response:", flipkartResponse?.data);
      if (flipkartResponse?.data?.products) {
        flipkartProducts = flipkartResponse.data.products.map(product => ({
          Image: product.images[0],
          Title: product.title,
          Price: (product.price),
          URL: product.url,
          Rating: product.rating.average,
          Platform: "Flipkart"
        }));
      }
    } catch (error) {
      console.error("Failed to fetch products from Flipkart:  ", error);
    }

    try {
      const amazonOptions = {
        method: 'GET',
        url: 'https://real-time-amazon-data.p.rapidapi.com/search',
        params: {
          query: productName,
          page: '1',
          country: 'IN',
          sort_by: 'RELEVANCE',
          product_condition: 'ALL',
          is_prime: 'false',
          currency: 'INR'
        },
        headers: {
          //'x-rapidapi-key': Include your key Provided by Rapid API,
          'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com'
        }
      };

      const amazonResponse = await axios.request(amazonOptions);
      if (amazonResponse?.data?.data?.products) {
        amazonProducts = amazonResponse.data.data.products.map(product => ({
          Image: product.product_photo,
          Title: product.product_title,
          Price: Number(product.product_price?.slice(1).split(',').join('')),
          URL: product.product_url,
          Rating: product.product_star_rating || 0,
          Platform: "Amazon"
        }));
      }
    } catch (error) {
      console.error("Failed to fetch products from Amazon:", error);
    }

    const topProducts = [
      ...flipkartProducts.slice(0, 5),
      ...amazonProducts.slice(0, 5),
    ];

    setProducts(topProducts);
    setLoading(false);

    chrome.storage.sync.set(
      { products: topProducts, productName: productName },
      function () {
        if (topProducts.length === 0) {
          setError("No Products Found.");
        }
      }
    );
  };

  const handleClear = () => {
    chrome.storage.sync.set(
      { products: [], productName: "" },
      function () {
        setProducts([]);
        setProductName("");
        setLoading(false);
      }
    );
  };

  return (
    <>
    {loading ? <span className="flex flex-col justify-center items-center w-[430px] h-[200px] bg-[#1F2833] text-[#C5C6C7] text-2xl">Loading....</span>:<>
      {products.length > 0 ? (
        <div className="flex flex-col justify-center items-center w-[430px] bg-[#1F2833]">
          <span className="text-3xl m-3 text-white">Product Results</span>
          <table className="table-auto w-full text-[#C5C6C7]">
            <thead>
              <tr>
                <th className="p-2">Image</th>
                <th className="p-2">Details</th>
                <th className="p-2">URL</th>
                <th className="p-2">Platform</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">
                    <img
                      src={product.Image}
                      alt={product.Title}
                      className="w-16 h-16 object-cover"
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col">
                      <span className="">{product.Title}</span>
                      <div className="flex flex-row justify-between my-3">
                        <i className="fa fa-inr" aria-hidden="true">
                          <span>{" " + product.Price + "/-"}</span>
                        </i>
                        <i className="fa fa-star" aria-hidden="true">
                          <span>{product.Rating}</span>
                        </i>
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <a
                      href={product.URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      Link
                    </a>
                  </td>
                  <td className="p-2">{product.Platform}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={handleClear}
            className="px-4 py-2 m-2 border-solid border-2 border-stone-800 rounded bg-[#66FCF1]"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center w-[430px] bg-[#1F2833]">
          <h2 className="text-3xl m-4 text-white">Search for the product</h2>
          <form onSubmit={handleSubmit} className="m-2 text-[#C5C6C7]">
            <input
              type="text"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="Enter the Product..."
              required
              className="w-60 h-8 border-solid border-2 border-stone-800 p-2 text-black"
            />
            <button
              type="submit"
              className="px-4 py-2 m-2 border-solid border-2 border-stone-800 rounded bg-[#66FCF1] text-black"
            >
              Search
            </button>
          </form>
          {error && <span className="text-[#C5C6C7]">{error}</span>}
        </div>
      )}
    </>}
      
    </>
  );
}

export default App;
