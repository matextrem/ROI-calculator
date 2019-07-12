import React, { useState } from 'react';
import { useDebounce } from 'use-debounce';
import uniswapService from './services/UniswapService';
import { Navbar, Spinner, Row, Container, InputGroup, FormControl, Button, Col, Dropdown, Card, Table } from 'react-bootstrap';
import logo from './logo.svg';
import './App.scss';
import UniswapService from './services/UniswapService';

const App = () => {

  const [loading, setLoading] = useState(false);
  const [roiData, setRoiData] = useState({});
  const [token, setToken] = useState(null);
  const [address, setAddress] = useState(null);
  const [debounceAddress] = useDebounce(address, 1000);


  const getROI = () => {
    async function fetchData() {
      setLoading(true);
      const data = await uniswapService.get(debounceAddress, token);
      const displayData = await uniswapService.getDisplayData(data);
      setRoiData(displayData);
      setLoading(false);
    }
    fetchData();
  };
  ;
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
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Account address"
                  aria-label="Account address"
                  aria-describedby="basic-addon2"
                />

                <InputGroup.Append>
                  <Button disabled={!address || !token} onClick={getROI} variant="outline-secondary">Search</Button>
                </InputGroup.Append>
              </InputGroup>
            </Col>
            <Col lg={3} md={3} sm={3} xs={3}>
              <Dropdown>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                  {token || 'Tokens'}
                </Dropdown.Toggle>
                <Dropdown.Menu className="token-selector">
                  {UniswapService.tokens().map((token, key) => <Dropdown.Item onClick={() => setToken(token)} key={`token-${key}`}>{token}</Dropdown.Item>)}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            {loading ?
              <div className="spinner">
                <h5>Analyzing all the transactions... (this might take a few minutes)</h5>
                <Spinner animation="grow" role="status" size="lg">
                  <span className="sr-only">Loading...</span>
                </Spinner>
              </div> :
              <>
                <Row lg={12} md={12} sm={12} xs={12}>
                  <div className="roi-box">
                    <Card>
                      <Card.Header as="h5">Value of your Investment Today: </Card.Header>
                      <Card.Body>
                        <Card.Title>{roiData.investmentToday || "-"} {roiData.investmentToday && "USD"}</Card.Title>
                      </Card.Body>
                    </Card>
                  </div>
                  <div className="roi-box">
                    <Card>
                      <Card.Header as="h5">Value if you HODL'd: </Card.Header>
                      <Card.Body>
                        <Card.Title>{roiData.valueHold || "-"} {roiData.valueHold && "USD"}</Card.Title>
                      </Card.Body>
                    </Card>
                  </div>
                </Row>
                {!loading && Object.keys(roiData).length !== 0 &&
                  <Row lg={12} md={12} sm={12} xs={12}>
                    <Table striped bordered hover>
                      <thead>
                        <tr>

                          <th>Your ETH</th>
                          <th>Your {token}</th>
                          <th>Value today</th>
                          <th>Value when invested</th>
                          <th>Net ROI</th>
                          <th>Price ROI</th>
                          <th>Uniswap ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{roiData.yourEth}</td>
                          <td>{roiData.yourToken}</td>
                          <td>${roiData.investmentToday}</td>
                          <td>${roiData.totalDeposited}</td>
                          <td>{roiData.netRoi}%</td>
                          <td>{roiData.priceRoi}%</td>
                          <td>{roiData.uniswapRoi}%</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Row>}
              </>}
          </Row>
        </div>

      </Container>
    </div>
  );
}

export default App;
