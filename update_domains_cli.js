const admin = require('firebase-admin');
const { GoogleAuth } = require('google-auth-library');

async function updateDomains() {
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform'
  });
  const client = await auth.getClient();
  const projectId = await auth.getProjectId();
  
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
  console.log('Fetching', url);
  
  const res = await client.request({ url });
  const current = res.data.authorizedDomains || [];
  console.log('Current domains:', current);
  
  const domains = [...new Set([...current, 'cctvquotation.com'])];
  
  console.log('Updating to:', domains);
  const updateRes = await client.request({
    url: `${url}?updateMask=authorizedDomains`,
    method: 'PATCH',
    data: { authorizedDomains: domains }
  });
  
  console.log('Updated domains:', updateRes.data.authorizedDomains);
}

updateDomains().catch(console.error);
