import React, { useEffect, useState } from 'react';
import uniswapService from './services/UniswapService';
import { Navbar, Spinner, Row, Container, InputGroup, FormControl, Button, Col, Dropdown } from 'react-bootstrap';
import logo from './logo.svg';
import './App.css';
import UniswapService from './services/UniswapService';

const App = () => {

  const [roiData, setRoiData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const data = await uniswapService.get('0x75bbc7d37d3bf975b527cf2e99b947d61a22ef95', 'WBTC');
      console.log('data', data);
    }
    fetchData();
  });
  return (
    <div className="App">
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="#">
          <img
            alt=""
            src={logo}
            width="30"
            height="30"
            className="d-inline-block align-top"
          />
          ROI Calculator
        </Navbar.Brand>
      </Navbar>
      <Container>
        <div className="main-container">
          <Row lg={12} md={12} sm={12} xs={12}>
            <Col lg={9} md={9} sm={9} xs={9}>
              <InputGroup className="mb-3">
                <FormControl
                  placeholder="Account address"
                  aria-label="Account address"
                  aria-describedby="basic-addon2"
                />
                <InputGroup.Append>
                  <Button variant="outline-secondary">Search</Button>
                </InputGroup.Append>
              </InputGroup>
            </Col>
            <Col lg={3} md={3} sm={3} xs={3}>
              <Dropdown>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                  Tokens
                </Dropdown.Toggle>
                <Dropdown.Menu className="token-selector">
                  {UniswapService.tokens().map((token, key) => <Dropdown.Item key={`token-${key}`}>{token}</Dropdown.Item>)}
                </Dropdown.Menu>
              </Dropdown>
            </Col>

            <Spinner animation="grow" role="status" size="lg">
              <span className="sr-only">Loading...</span>
            </Spinner>
          </Row>
        </div>

      </Container>
    </div>
  );
}

export default App;
