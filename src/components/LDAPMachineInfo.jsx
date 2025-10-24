import { Typography } from '@mui/material';
import MUIDataTable from "mui-datatables";
import CircularProgress from '@mui/material/CircularProgress';
import { useAppData } from '../contexts/AppDataProvider';

export default function LDAPMachineInfo(props) {
    // Get pre-fetched data from context
    const { queries } = useAppData();
    const ldap_machine_info = queries.ldapBasicMachineInfo;

    const columns = ['name', 'operatingSystem', 'operatingSystemVersion', 'isCriticalSystemObject',
                      'pwdLastSet','whenCreated',
                      'whenChanged','lastLogon','logonCount','lastLogonTimestamp',
                      'objectGUID']
    const options = {
        filterType: 'checkbox',
        rowsPerPageOptions: [10,25,50,250,500,1000],
        downloadOptions: {'filename': 'ldap_machine_info.csv'},
        selectableRows: 'none'
      };

      if (ldap_machine_info.isLoading) return <CircularProgress></CircularProgress>;
      if (ldap_machine_info.error) return "An error has occurred: " + ldap_machine_info.error.message;
      if (ldap_machine_info.data) {
        console.log(ldap_machine_info.data)
        return (
            <>
            <Typography variant='h3'>{props.name}</Typography>
            <MUIDataTable
            title={"LDAP Machine Info"}
            data={ldap_machine_info.data}
            columns={columns}
            options={options}
            />
            </>
            )

    }
}
