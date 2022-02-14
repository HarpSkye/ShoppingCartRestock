// simulate getting products from DataBase
// const products = [
//   { name: "Apples", country: "Italy", cost: 3, instock: 10 },
//   { name: "Oranges", country: "Spain", cost: 4, instock: 3 },
//   { name: "Beans", country: "USA", cost: 2, instock: 5 },
//   { name: "Cabbage", country: "USA", cost: 1, instock: 8 },
// ];
//=========Cart=============
const Cart = (props) => {
  const {  Accordion} = ReactBootstrap;

  return <Accordion defaultActiveKey="0">{list}</Accordion>;
};

const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });

  useEffect(() => {
  
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
       
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

const Products = (props) => {
  const [items, setItems] = React.useState([]);
  const [cart, setCart] = React.useState([]);
  // const [total, setTotal] = React.useState(0);
  
  const {
    Card,
    Accordion,
    Button,
    Container,
    Row,
    Col,
    Image    
  } = ReactBootstrap;

  //  Fetch Data
  const { useState, useEffect} = React;
  const [query, setQuery] = useState("http://localhost:1337/api/products");
  const [{ data, isLoading, isError }, doFetch] = useDataApi(
    "http://localhost:1337/api/products",
    {
      data: [],
    }
  );

  // Fetch Data
  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.filter((item) => item.name == name);
    setCart([...cart, ...item]);

  

  // Reduce Stock:
  let marketStock = [...items];
  marketStock.forEach(p => p.name === name ? p.instock-- : p.instock = p.instock);
  setItems([...marketStock]);
};

//Delete cart item and put it back to stock: 
  const deleteCartItem = (index) => {
    let product = cart.filter((item,i) => index === i)[0];
    let marketStock = [...items];
    marketStock.forEach(p => p.name == product.name ? p.instock++ : p.instock += 0);
    setItems([...marketStock]);

    let newCart = cart.filter((item, i) => index != i);
    setCart(newCart);
  };
  const photos = ["apple.png", "orange.png", "beans.png", "cabbage.png", "banana.png", "avocado.png"];

  let list = items.map((item, index) => {
    if(item.instock > 0){
      return (
        <li key={index}>
          <Image src={photos[index % 6]} width={70} roundedCircle></Image>
          <div>
            <Button variant="warning" size="large" name={item.name} type="submit" onClick={addToCart}>
              {item.name} : ${item.cost}
            </Button>
            <div>{item.instock} in stock</div>
          </div>
        </li>
      );
    }
    
  });
  let cartList = cart.map((item, index) => {
    return (
      <Card key={index}>
        <Card.Header>
          <Accordion.Toggle as={Button} variant="link" eventKey={1 + index}>
            {item.name}
          </Accordion.Toggle>
        </Card.Header>
        <Accordion.Collapse
          onClick={() => deleteCartItem(index)}
          eventKey={1 + index}
        >
          <Card.Body>
            <div>
              <div>$ {item.cost} from {item.country}</div>
              <Button onChange={()=> deleteCartItem(index)}>Item Remove</Button>
            </div>
            
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  });

  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    return newTotal;
  };
  // TODO: implement the restockProducts function
  const restockProducts = async (url) => {
    await doFetch(url);

    let marketStock = [...items];
    if (items.length === 0) {
      data.data.forEach(({attributes: p }) => {
        const {name, country, cost, instock} = p;
        marketStock.push({name, country, cost: Number(cost), instock: Number(instock)});
      });
    }
    else {
      data.data.forEach(({attributes: p}) => {
        let restockedItem = marketStock.filter(item => item.name == p.name)[0];
        restockedItem ? restockedItem.instock += p.instock : restockedItem.instock += 0;
      });
    }
    
    setItems(marketStock);
  };

  useEffect(()=> {
    if (items.length === 0) {
      restockProducts("http://localhost:1337/api/products");
    }}, [items]);

  return (
    <Container>
      <Row>
        <Col>
          <h1>Product List</h1>
          <ul style={{ listStyleType: "none" }}>{list}</ul>
        </Col>
        <Col>
          <h1>Cart Contents</h1>
          <Accordion>{cartList}</Accordion>
        </Col>
        <Col>
          <h1>CheckOut </h1>
          <Button onClick={checkOut}>CheckOut $ {finalList().total}</Button>
          <div> {finalList().total > 0 && finalList().final} </div>
        </Col>
      </Row>
      <Row>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            restockProducts(`${query}`);
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">{items.length === 0 ? 'Stock Products' : 'ReStock Products'}</button>
        </form>
      </Row>
    </Container>
  );
};
// ========================================
ReactDOM.render(<Products />, document.getElementById("root"));
