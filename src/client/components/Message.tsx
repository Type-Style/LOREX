import React, { useContext } from 'react'
import { Context } from "../context";

export const Message = ({ messageObj, page }: { messageObj: Omit<client.entryData, 'fetchTimeData'>, page: string}) => {
	const [contextObj] = useContext(Context);

	return (
		<>
			<span className={`message ${messageObj.isError ? "center error" : ""}`}>
				{messageObj.isError ? (
					<>
						<strong className="title">{messageObj.status}</strong>
						<span className="fadeIn">{messageObj.message.split('\n').map((line: string, index: number) => (
							<span key={index}>
								{line}
								<br />
							</span>
						))}</span>
					</>
				) : page == "start" && contextObj.userInfo ? (
					<>
						<strong className="title">{contextObj.userInfo?.user}</strong>
						<span className="fade">Welcome back</span>
					</>
				) : page == "login" && messageObj.message ? (
					<strong className="title">{messageObj.message}</strong>
				) : null}
			</span>
		</>
	)
}
