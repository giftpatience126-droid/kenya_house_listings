import { API_ENDPOINTS } from './api';

export const checkApiStatus = async () => {
  const status = {
    overall: 'unknown',
    endpoints: {},
    timestamp: new Date().toISOString()
  };

  const endpoints = [
    { name: 'health', url: API_ENDPOINTS.health }
  ];

  let workingCount = 0;
  const totalCount = endpoints.length;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      status.endpoints[endpoint.name] = {
        status: response.ok ? 'working' : 'error',
        statusCode: response.status,
        url: endpoint.url
      };

      if (response.ok) {
        workingCount++;
      }
    } catch (error) {
      status.endpoints[endpoint.name] = {
        status: 'unreachable',
        error: error.message,
        url: endpoint.url
      };
    }
  }

  status.overall = workingCount === totalCount
    ? 'all_working'
    : workingCount > 0
      ? 'partial'
      : 'none_working';
  status.workingCount = workingCount;
  status.totalCount = totalCount;

  return status;
};

export const getApiHealthMessage = (status) => {
  const { overall, workingCount, totalCount } = status;

  switch (overall) {
    case 'all_working':
      return 'All APIs are reachable';
    case 'partial':
      return `${workingCount}/${totalCount} API checks passed. Some features may be limited`;
    case 'none_working':
      return 'No APIs are reachable. Using local fallbacks only';
    default:
      return 'Checking API status...';
  }
};

export const testPaymentFlow = async () => {
  const testResults = {
    mpesaPayment: false,
    premiumPayment: false,
    cartSync: false,
    reservationSync: false,
    timestamp: new Date().toISOString()
  };

  try {
    const { mpesaPaymentApi } = await import('./api');
    await mpesaPaymentApi({
      phone: '254700000000',
      amount: '30',
      email: 'test@example.com',
      account_reference: 'Test',
      transaction_desc: 'Test payment'
    });
    testResults.mpesaPayment = true;
  } catch (error) {
    console.log('M-Pesa payment test failed:', error.message);
  }

  try {
    const { premiumPaymentApi } = await import('./api');
    await premiumPaymentApi({
      phone: '254700000000',
      amount: '100',
      email: 'test@example.com'
    });
    testResults.premiumPayment = true;
  } catch (error) {
    console.log('Premium payment test failed:', error.message);
  }

  try {
    const { saveCartApi } = await import('./api');
    await saveCartApi({
      buyerEmail: 'test@example.com',
      buyerName: 'Test User',
      items: [{ id: 1, title: 'Test Item', price: 1000 }]
    });
    testResults.cartSync = true;
  } catch (error) {
    console.log('Cart sync test failed:', error.message);
  }

  try {
    const { createReservationApi } = await import('./api');
    await createReservationApi({
      buyerName: 'Test User',
      buyerEmail: 'test@example.com',
      buyerPhone: '254700000000',
      guests: 2,
      reservationDate: '2024-01-01',
      paymentMethod: 'mpesa',
      amount: 1000,
      items: [{ id: 1, title: 'Test Item', price: 1000 }]
    });
    testResults.reservationSync = true;
  } catch (error) {
    console.log('Reservation sync test failed:', error.message);
  }

  return testResults;
};
