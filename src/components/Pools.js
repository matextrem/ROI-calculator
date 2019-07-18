import React, { useState, useEffect } from 'react';
import { Row, Table, Spinner } from 'react-bootstrap';
import poolService from '../services/PoolService';
import './Pools.scss';

const Pools = () => {

  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState([]);


  async function getPools() {
    setLoading(true);
    const response = await poolService.get();
    setPools(response.data);
    setLoading(false);
  }
  useEffect(() => {
    getPools()
  }, []);
  return (
    <Row lg={12} md={12} sm={12} xs={12} className="pool-container">
      {loading ? (
        <div className="spinner">
          <Spinner animation="grow" role="status" size="lg">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          <h3>Liquidity pools list</h3>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Liquidity Pool</th>
                <th>Current Liquidity ETH</th>
                <th>Expected Fees</th>
                <th>Expected impermanent loss</th>
                <th>Expected net ROI</th>
                <th>Equivalent APR</th>
              </tr>
            </thead>
            <tbody>
              {pools.map(pool => {
                  return (
                    <tr key={`pool-${pool.token_symbol}`}>
                      <td>
                        ETH-
                        {pool.token_symbol}
                      </td>
                      <td>{pool.current_pool_size_eth.toFixed(2)}</td>
                      <td>
                        {(pool.share_of_fees_owned * 10).toFixed(2)}
                        %
                      </td>
                      <td>
                        {(pool.impermanent_loss * 100).toFixed(2)}
                        %
                      </td>
                      <td>
                        <b>
                          {(pool.projected_total_yield * 100).toFixed(2)}
                          %
                        </b>
                      </td>
                      <td>
                        {(pool.equivalent_apr * 100).toFixed(2)}
                        %
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </Table>
        </>
        )}
    </Row>
  );
}

export default Pools;