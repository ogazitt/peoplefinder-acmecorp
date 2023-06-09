import React from 'react'
import { CardDeck } from 'react-bootstrap'
import UserCard from './UserCard'

const UserList = ({ users, setUsers }) => {
  const idKey = 'key';
  const results = 40;

  return (
    users ?
      <CardDeck>
        {users.slice(0, results).map(u => <UserCard key={u[idKey]} user={u} />)}
      </CardDeck> :
      <div />
  )
}

export default UserList